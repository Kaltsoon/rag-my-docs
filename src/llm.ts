import { Ollama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { repositorySimilaritySearch } from "./vectorStore";
import { Repository } from "./types";
import { env } from "./env";
import { Document } from "@langchain/core/documents";

const llm = new Ollama({
  model: env.OLLAMA_MODEL,
  baseUrl: env.OLLAMA_URL,
});

const PROMPT_TEMPLATE = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
  You are an assistant for answering questions about the following GitHub repository:
  
  {repositoryInfo}
  
  Use the following Markdown documentation files in the repository and general repository information to answer the question.
  Each file contains the file path and its contents in Markdown format.
  Do not use any information outside the documentation file contents and the general repository information provided.
  Do not use Markdown formatting in your answers.
  If you don't know the answer, just say that you don't know.

  Documentation files:
  {documentationFiles}
  `,
  ],
  ["user", "{question}"],
]);

export async function invokeForRepository(
  repository: Repository,
  question: string
) {
  const matchingDocuments = await repositorySimilaritySearch(
    { owner: repository.owner.login, repo: repository.name },
    question,
    3
  );

  return llm.invoke(
    await PROMPT_TEMPLATE.invoke({
      documentationFiles: documentsToContext(matchingDocuments),
      repositoryInfo: repositoryDataToRepositoryInfo(repository),
      question,
    })
  );
}

function repositoryDataToRepositoryInfo(repository: Repository) {
  return `
  Name: ${repository.name}
  Owner: ${repository.owner.login}
  Description: ${repository.description}
  License: ${repository.license.name}
  URL: ${repository.htmlUrl}
  `;
}

function documentsToContext(documents: Document[]) {
  return documents.map((doc: any) => doc.pageContent).join("\n---\n");
}
