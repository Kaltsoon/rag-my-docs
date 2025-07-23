# 📚 RAG My Docs

[![Test](https://github.com/Kaltsoon/rag-my-docs/actions/workflows/test.yml/badge.svg)](https://github.com/Kaltsoon/rag-my-docs/actions/workflows/test.yml)

A CLI application for building a [RAG](https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/) for GitHub repository's markdown files and using it as a context for an LLM to ask questions related to the repository's documentation.

The client code is implemented using TypeScript. PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) is used as a vector database. Redis is used for caching purposes.

## Requirements

Docker and [Ollama](https://ollama.com/).

## How to use?

1. Setup [Ollama](https://ollama.com/) and pull the `llama3:8b` model by running `ollama pull llama3:8b`. You can use other Ollama models as well, see next step for configuration instructions.
2. Create a `.env` and with the contents of the `.env.template` file. Feel free to change the environment variables, e.g. `OLLAMA_MODEL` variable to change the model.
2. Run the containers by running `docker compose up -d pg redis`.
3. Once the containers are ready, run the CLI application by running `docker compose run -it --rm cli` and follow the instructions provided by the application.
