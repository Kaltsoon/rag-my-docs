import { Request, Response, NextFunction } from "express";
import * as z from "zod";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Request validation failed",
      properties: z.flattenError(err),
    });
  }

  return res.status(500).json({
    message: "Something went wrong",
  });
}
