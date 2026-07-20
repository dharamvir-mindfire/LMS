import express, { Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/ErrorHandler";

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:8081",
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) =>
  res.json({ status: "ok" }),
);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
