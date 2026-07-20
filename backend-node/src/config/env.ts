import dotenv from "dotenv";
import path from "path";

const nodeEnv = process.env.NODE_ENV || "development";
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);

dotenv.config({ path: envFile });
dotenv.config();
