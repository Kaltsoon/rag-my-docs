import { OllamaEmbeddings } from "@langchain/ollama";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";

import { env } from "./env";
import { RepositoryIdentifier } from "./types";
import { setRepositoryDocumentIds, getRepositoryDocumentIds } from "./redis";
import { logger } from "./logger";

const embeddings = new OllamaEmbeddings({
  model: env.OLLAMA_MODEL,
  baseUrl: env.OLLAMA_URL,
});

const config = {
  postgresConnectionOptions: {
    type: "postgres",
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  },
  tableName: "repository_documentation_files",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine",
} as const;

let cachedVectorStore: PGVectorStore;

logger.info("Hello world!")

export async function addDocuments(documents: Document[]) {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(documents);

  return documents;
}

export async function deleteDocuments(ids: string[]) {
  const vectorStore = await getVectorStore();
  await vectorStore.delete({ ids });
}

export async function repositorySimilaritySearch(
  repository: RepositoryIdentifier,
  query: string,
  amount?: number
) {
  const vectorStore = await getVectorStore();

  return vectorStore.similaritySearch(query, amount, {
    owner: repository.owner,
    repo: repository.repo,
    ref: repository.ref ?? null,
  });
}

export async function updateRepositoryVectorStore(
  repository: RepositoryIdentifier,
  documents: Document[]
) {
  const nextDocumentIds = documents.map((doc) => doc.id!);
  const previousDocumentIds = await getRepositoryDocumentIds(repository);

  if (!documentIdsAreEqual(nextDocumentIds, previousDocumentIds)) {
    logger.info(prefixLoggerMessage("Cache miss"), {
      repository,
      nextDocumentIds,
      previousDocumentIds,
    });

    if (previousDocumentIds.length > 0) {
      logger.info(prefixLoggerMessage("Deleting previous documents"), {
        repository,
      });
      await deleteDocuments(previousDocumentIds);
    }

    return Promise.all([
      addDocuments(documents),
      setRepositoryDocumentIds(repository, documents),
    ]);
  }

  logger.info(prefixLoggerMessage("Cache hit"), { repository })
}

function documentIdsAreEqual(ids: string[], idsOther: string[]) {
  return ids.toSorted().toString() === idsOther.toSorted().toString();
}

async function getVectorStore() {
  if (cachedVectorStore) {
    return cachedVectorStore;
  }

  cachedVectorStore = await PGVectorStore.initialize(embeddings, config);

  return cachedVectorStore;
}

function prefixLoggerMessage(message: string) {
  return `Vector store: ${message}`;
}
