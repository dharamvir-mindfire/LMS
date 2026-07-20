import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
