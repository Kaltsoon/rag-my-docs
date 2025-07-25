import { Request, Response } from "express";

import * as z from "zod";
import { RepositoryDocumentationLoader } from "../RepositoryDocumentationLoader";
import { updateRepositoryVectorStore } from "../vectorStore";
import { getRepository } from "../githubApi";
import { invokeForRepository } from "../llm";

const RequestBodySchema = z.object({
  question: z.string(),
  ref: z.string().optional(),
  auth: z.string().optional(),
});

const RequestParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

export async function promptHandler(
  req: Request<
    z.infer<typeof RequestParamsSchema>,
    any,
    z.infer<typeof RequestBodySchema>
  >,
  res: Response
) {
  const { owner, repo } = RequestParamsSchema.parse(req.params);
  const { ref, auth, question } = RequestBodySchema.parse(req.body);
  const repositoryWithAuth = { owner, repo, ref, auth };
  const loader = new RepositoryDocumentationLoader(repositoryWithAuth);
  const documents = await loader.load();

  await updateRepositoryVectorStore(repositoryWithAuth, documents);

  const repositoryData = await getRepository(repositoryWithAuth);
  const answer = await invokeForRepository(repositoryData, question);

  res.json({ answer });
}
