import { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response) {
  return res
    .status(404)
    .json({ message: "Request path or method is not supported" });
}
