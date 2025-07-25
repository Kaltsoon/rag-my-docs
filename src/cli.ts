import inquirer from "inquirer";
import { oraPromise } from "ora";
import * as z from "zod";
import { getRepository, RepositoryData } from "./githubApi";
import { RepositoryIdentifierWithAuth } from "./types";
import { updateRepositoryVectorStore } from "./vectorStore";
import { invokeForRepository } from "./llm";
import { RepositoryDocumentationLoader } from "./RepositoryDocumentationLoader";

function parseRepositoryUrl(url: string) {
  const parts = url.split("/").filter((part) => !!part);

  return { owner: parts.at(-2), repo: parts.at(-1) };
}

async function validateRepositoryUrl(input: string) {
  if (!input.startsWith("https://github.com")) {
    return false;
  }

  const { owner, repo } = parseRepositoryUrl(input);

  if (!owner || !repo) {
    return false;
  }

  return true;
}

const REPOSITORY_INFO_PROMPTS = [
  {
    name: "url",
    type: "input",
    message: "GitHub repository URL in format https://github.com/OWNER/REPO",
    validate: validateRepositoryUrl,
  },
  {
    name: "ref",
    type: "input",
    message:
      "The name of the commit/branch/tag. Leave empty to default to the repository's default branch",
  },
  {
    name: "auth",
    type: "input",
    message:
      "GitHub authentication token. Only required while accessing non-public resources",
  },
] as const;

const QUESTION_PROMPTS = [
  {
    name: "question",
    type: "input",
    message: "What would you like to know about the repository?",
  },
] as const;

const RepositoryInfoAnswersSchema = z.object({
  url: z.string(),
  ref: z.string(),
  auth: z.string(),
});

const QuestionAnswersSchema = z.object({
  question: z.string(),
});

export async function runCli() {
  console.log(
    "👋 Welcome to the RAG My Docs CLI application!\n\nLet's get started by asking a few questions about the repository you are interested in.\n"
  );

  const answers = await inquirer.prompt(REPOSITORY_INFO_PROMPTS);
  const repositoryInfo = RepositoryInfoAnswersSchema.parse(answers);

  const { owner, repo } = parseRepositoryUrl(repositoryInfo.url);

  const repositoryWithAuth = {
    owner: owner!,
    repo: repo!,
    auth: repositoryInfo.auth,
  };

  const repositoryData = await oraPromise(
    () => getRepository(repositoryWithAuth),
    "Retrieving repository information"
  );

  const documents = await oraPromise(
    () => loadDocuments(repositoryWithAuth),
    "Retrieving repository documentation"
  );

  await oraPromise(
    () => updateRepositoryVectorStore(repositoryWithAuth, documents),
    "Updating the vector database"
  );

  runQuestionLoop(repositoryData);
}

async function runQuestionLoop(repositoryData: RepositoryData) {
  while (true) {
    const answers = await inquirer.prompt(QUESTION_PROMPTS);
    const { question } = QuestionAnswersSchema.parse(answers);

    const answer = await oraPromise(
      () => invokeForRepository(repositoryData, question),
      "Asking LLM your question"
    );

    console.log(answer);
  }
}

async function loadDocuments(repository: RepositoryIdentifierWithAuth) {
  const loader = new RepositoryDocumentationLoader(repository);
  return loader.load();
}
