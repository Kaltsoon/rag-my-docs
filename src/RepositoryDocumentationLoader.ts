import AdmZip from "adm-zip";
import { glob } from "glob";
import { readFile, rm } from "node:fs/promises";
import { sep as pathSeparator, resolve as pathResolve } from "path";
import { LRUCache } from "lru-cache";
import objectHash from "object-hash";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import getUuidByString from "uuid-by-string";

import {
  DocumentationFile,
  RepositoryIdentifier,
  RepositoryIdentifierWithAuth,
} from "./types";
import { getRepositoryContentZip } from "./githubApi";
import { logger } from "./logger";

const textSplitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 2000,
  chunkOverlap: 200,
});

const cache = new LRUCache<string, Document[]>({
  max: 10,
  ttl: 1000 * 60 * 60,
});

export class RepositoryDocumentationLoader {
  #repository: RepositoryIdentifierWithAuth;

  constructor(repository: RepositoryIdentifierWithAuth) {
    this.#repository = repository;
  }

  async load() {
    const cacheKey = this.#getCacheKey();

    if (cache.has(cacheKey)) {
      logger.info(prefixLoggerMessage(`Cache hit for key ${cacheKey}`));
      return cache.get(cacheKey)!;
    }

    const documentationFiles = await fetchRepositoryDocumentation(
      this.#repository
    );

    const documents = await getDocumentsFromRepository(
      this.#repository,
      documentationFiles
    );

    logger.info(
      prefixLoggerMessage(
        `Cache miss for key ${cacheKey}, ${documents.length} documents loaded`
      )
    );

    cache.set(cacheKey, documents);

    return documents;
  }

  #getCacheKey() {
    return `${this.#repository.owner}/${this.#repository.repo}/${
      this.#repository.ref ?? ""
    }`;
  }
}

function prefixLoggerMessage(message: string) {
  return `Repository documentation loader: ${message}`;
}

function getRepositoryFilePath(fullPath: string, tempFolderName: string) {
  const pathParts = fullPath.split(pathSeparator);
  const tempFolderIndex = pathParts.findIndex(
    (part) => part === tempFolderName
  );

  return pathParts.slice(tempFolderIndex + 2, pathParts.length).join("/");
}

function getTempRepositoryFolderName(owner: string, repo: string) {
  return `${owner}-${repo}-${Date.now()}`;
}

export async function fetchRepositoryDocumentation(
  repository: RepositoryIdentifierWithAuth
) {
  const { owner, repo, ref } = repository;

  const buffer = await getRepositoryContentZip(repository);
  const zip = new AdmZip(buffer);

  const tempFolderName = getTempRepositoryFolderName(owner, repo);
  const path = pathResolve(__dirname, "...", `data/${tempFolderName}`);
  zip.extractAllTo(path, true);

  const documentationFiles: DocumentationFile[] = [];

  for (const filePath of await glob(`${path}/**/*.md`)) {
    const repositoryFilePath = getRepositoryFilePath(filePath, tempFolderName);
    const content = await readFile(filePath, "utf-8");

    documentationFiles.push({
      path: repositoryFilePath,
      content,
    });
  }

  await rm(path, { recursive: true, force: true });

  return documentationFiles;
}

function getPageContentFromDocumentationFile(
  repository: RepositoryIdentifier,
  file: DocumentationFile
) {
  return `GitHub repository: ${repository.owner}/${repository.repo}\nFile path: ${file.path}\nFile content:${file.content}`;
}

function getDocumentationFileId(
  repository: RepositoryIdentifier,
  file: DocumentationFile,
  splitIndex: number
) {
  const contentHash = objectHash({
    repositoryName: repository.repo,
    repositoryOwner: repository.owner,
    path: file.path,
    content: file.content,
    splitIndex,
  });

  return getUuidByString(contentHash);
}

async function getDocumentsFromRepository(
  repository: RepositoryIdentifier,
  documentationFiles: DocumentationFile[]
) {
  let documents: Document[] = [];

  for (const file of documentationFiles) {
    const fileDocuments = await documentationFileToDocuments(repository, file);
    documents = [...documents, ...fileDocuments];
  }

  return documents;
}

async function documentationFileToDocuments(
  repository: RepositoryIdentifier,
  file: DocumentationFile
): Promise<Document[]> {
  const splits = await textSplitter.splitText(file.content);

  return splits.map((content, index) => ({
    id: getDocumentationFileId(repository, { ...file, content }, index),
    pageContent: getPageContentFromDocumentationFile(repository, {
      ...file,
      content,
    }),
    metadata: {
      filePath: file.path,
      owner: repository.owner,
      repo: repository.repo,
      ref: repository.ref ?? null,
    },
  }));
}
