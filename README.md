# 📚 RAG My Docs

[![Test](https://github.com/Kaltsoon/rag-my-docs/actions/workflows/test.yml/badge.svg)](https://github.com/Kaltsoon/rag-my-docs/actions/workflows/test.yml)

A REST API and CLI application for building a [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) for GitHub repository's markdown files and using it as a context for an LLM to ask questions related to the repository's documentation.

The client code is implemented using TypeScript. PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) is used as a vector database. Redis is used for caching purposes.

## Requirements

Docker and [Ollama](https://ollama.com/).

## How to use?

1. Setup [Ollama](https://ollama.com/) and pull the `llama3:8b` model by running `ollama pull llama3:8b`. You can use other Ollama models as well, see next step for configuration instructions.
2. Create a `.env` and with the contents of the `.env.template` file. Feel free to change the environment variables, e.g. `OLLAMA_MODEL` variable to change the model.
3. Run the containers by running `docker compose up -d`
4. Once the containers are ready, there's two ways to access the LLM: `http://localhost:3000/api/repos/{owner}/{repo}/prompt` REST API endpoint and the CLI application. Details for both are below.

> [!WARNING]  
> GitHub's API [limits the requests for unauthenticated users](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28). Provide a GitHub authentication token as instructed below to increate your rate limit.

### REST API

REST API endpoint `POST http://localhost:3000/api/repos/{owner}/{repo}/prompt` (e.g. <http://localhost:3000/api/repos/Kaltsoon/rag-my-docs>) accepts a request body in the following format:

```json
{
  "question": "What is the purpose of the repository?",
  "ref": "dev",
  "auth": "supersecret"
}
```

The `ref` and `auth` attributes are optional. The `ref` attribute determines name of the commit/branch/tag. Defaults to repository's default branch. The `auth` attribute determines the GitHub authentication token used for requests to GitHub's API. It is only required while accessing non-public resources or to increase the rate limit.

The response contains the answer from the LLM.

Here's an example request using `curl`:

```bash
curl -X POST http://http://localhost:3000/api/repos/Kaltsoon/rag-my-docs \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the purpose of the repository?"}'
```


> [!WARNING]  
> The first request for the repository will take some time, but the subsequent request to the same repository are much faster due to caching.

### CLI

You can run the CLI application by running `docker compose exec -it app npm run start:cli`. The CLI application will provide instructions on the usage.

### Debugging

Setting `LOGGER_LEVEL=debug` in the `.env` file will enable logging and provide information on, for example, cache performance.