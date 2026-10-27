// Entry point: reads config from the environment and starts the server.
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "./db.js";
import { createApp } from "./createApp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DATABASE_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL
    ? path.join("/tmp", "tasks.db")
    : path.join(__dirname, "../data/tasks.db"));

const db = createDb(DATABASE_PATH);
const app = createApp(db);

if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`Task Tracker API listening on http://127.0.0.1:${PORT}`);
    console.log(`Using database file: ${DATABASE_PATH}`);
  });
}

export default app;
