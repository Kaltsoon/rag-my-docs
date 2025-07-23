import * as z from "zod";

const EnvSchema = z.object({
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().int(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  REDIS_URL: z.string(),
  OLLAMA_URL: z.string(),
  OLLAMA_MODEL: z.string(),
});

export const env = EnvSchema.parse(process.env);
