import express from "express";
import { env } from "../env";
import { promptHandler } from "./promptHandler";
import { errorHandler } from "./errorHandler";
import { notFoundHandler } from "./notFoundHandler";
import morgan from "morgan";

const port = env.API_PORT;
const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.post("/api/repos/:owner/:repo/prompt", promptHandler);

app.use(notFoundHandler)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`REST API is ready for requests at http://localhost:${port}`);
});
