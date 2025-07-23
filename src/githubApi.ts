import { Octokit } from "octokit";
import { RepositoryIdentifier, Repository } from "./types";

export interface RepositoryWithAuth extends RepositoryIdentifier {
  auth?: string;
}

export async function getRepositoryContentZip(repository: RepositoryWithAuth) {
  const { auth, owner, repo, ref } = repository;

  const octokit = new Octokit({
    auth,
  });

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/zipball/{ref}",
    {
      owner,
      repo,
      ref,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(data);
}

export async function getRepository(
  repository: RepositoryWithAuth
): Promise<Repository> {
  const { auth, owner, repo } = repository;

  const octokit = new Octokit({
    auth,
  });

  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  const {
    id,
    name,
    full_name: fullName,
    description,
    html_url: htmlUrl,
    owner: ownerObject,
    license,
  } = data;

  return {
    id,
    name,
    fullName,
    description,
    htmlUrl,
    owner: {
      login: ownerObject.login,
    },
    license: {
      name: license.name,
    },
  };
}
