import { createClient, RedisClientType } from "redis";
import { Document } from "@langchain/core/documents";
import * as z from "zod";
import { RepositoryIdentifier } from "./types";
import { env } from "./env";

type CacheKeyPart = string | null | undefined;

let cachedClient: ReturnType<typeof createClient>;

const RepositoryDocumentationIdsSchema = z.array(z.string());

export async function setRepositoryDocumentIds(
  repository: RepositoryIdentifier,
  documents: Document[]
) {
  const client = await getClient();
  const ids = documents.map((document) => document.id).toSorted();

  await client.set(
    getRepositoryDocumentIdsCacheKey(repository),
    JSON.stringify(ids)
  );
}

export async function getRepositoryDocumentIds(repository: RepositoryIdentifier) {
  const client = await getClient();
  const value = await client.get(getRepositoryDocumentIdsCacheKey(repository));

  if (!value) {
    return [];
  }

  return RepositoryDocumentationIdsSchema.parse(JSON.parse(value));
}

function getCacheKey(parts: CacheKeyPart[]) {
  return parts.map((part) => part ?? "$NULL$").join(".");
}

function getRepositoryDocumentIdsCacheKey(repository: RepositoryIdentifier) {
  return getCacheKey([
    "repository_document_ids",
    repository.owner,
    repository.repo,
    repository.ref,
  ]);
}

async function getClient() {
  if (!cachedClient) {
    cachedClient = createClient({
      url: env.REDIS_URL,
    });
  }

  if (!cachedClient.isOpen) {
    await cachedClient.connect();
  }

  return cachedClient;
}
