import { Ollama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { repositorySimilaritySearch } from "./vectorStore";
import { env } from "./env";
import { Document } from "@langchain/core/documents";
import { RepositoryData } from "./githubApi";

const llm = new Ollama({
  model: env.OLLAMA_MODEL,
  baseUrl: env.OLLAMA_URL,
});

const PROMPT_TEMPLATE = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
  You are an assistant for answering questions about the GitHub repository {repositoryName}.
  Use the following Markdown documentation files retrieved from the the repository and general repository information to answer the question.
  Each documentation file contains the file path and its contents in Markdown format.
  You can use your general knowledge about Git and GitHub but otherwise do not use any information outside the documentation file contents and the general repository information provided.
  If you don't know the answer, just say that you don't know.

  General repository information in JSON format:
  
  {repositoryData}

  Documentation files:
  {documentationFiles}
  `,
  ],
  ["user", "{question}"],
]);

export async function invokeForRepository(
  repository: RepositoryData,
  question: string
) {
  const matchingDocuments = await repositorySimilaritySearch(
    { owner: repository.owner.login, repo: repository.name },
    question,
    3
  );

  return llm.invoke(
    await PROMPT_TEMPLATE.invoke({
      repositoryName: repository.name,
      documentationFiles: documentsToContext(matchingDocuments),
      repositoryData: JSON.stringify(repository),
      question,
    })
  );
}

function documentsToContext(documents: Document[]) {
  return documents.map((doc: any) => doc.pageContent).join("\n---\n");
}
