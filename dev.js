#!/usr/bin/env node
// Zero-dependency local development runner.
// Runs both Backend and Frontend concurrently with styled console output
// and graceful termination on Ctrl+C.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendDir = path.join(__dirname, "Backend");
const frontendDir = path.join(__dirname, "Frontend");

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[35m%s\x1b[0m", " 🚀 Task Tracker Local Development Environment");
console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("Starting Backend (Port 3000) and Frontend (Port 5173)...\n");

function runProcess(name, cmd, args, cwd, colorCode) {
  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  const prefix = `\x1b[${colorCode}m[${name}]\x1b[0m `;

  child.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${prefix}${line}`);
      }
    }
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.error(`${prefix}\x1b[31m${line}\x1b[0m`);
      }
    }
  });

  child.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}process exited with code ${code}`);
    }
  });

  return child;
}

const backendProcess = runProcess("Backend", "npm", ["run", "dev"], backendDir, "36"); // Cyan
const frontendProcess = runProcess("Frontend", "npm", ["run", "dev"], frontendDir, "35"); // Magenta

function cleanup() {
  console.log("\n\x1b[33mStopping all services...\x1b[0m");
  backendProcess.kill("SIGTERM");
  frontendProcess.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

