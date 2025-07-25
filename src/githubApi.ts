import { Octokit } from "@octokit/rest";
import { RepositoryIdentifierWithAuth } from "./types";

export type RepositoryData = Awaited<ReturnType<typeof getRepository>>

export async function getRepositoryContentZip(
  repository: RepositoryIdentifierWithAuth
) {
  const { auth, owner, repo, ref } = repository;

  const octokit = new Octokit({
    auth,
  });

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/zipball/{ref}",
    {
      owner,
      repo,
      ref: ref ?? "",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return Buffer.from(data as ArrayBuffer);
}

export async function getRepository(repository: RepositoryIdentifierWithAuth) {
  const { auth, owner, repo } = repository;

  const octokit = new Octokit({
    auth,
  });

  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  return data;
}
