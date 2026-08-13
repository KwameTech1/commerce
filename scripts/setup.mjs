import { spawnSync, spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

import { cleanNext } from "./clean-next.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const shell = process.platform === "win32";

const skipClean = args.includes("--no-clean") || args.includes("--keep-cache");
const forwarded = args.filter((a) => !a.startsWith("--"));

function fail(message) {
  console.error(message);
  process.exit(1);
}

const run = (command, options) => spawnSync(command, [], { shell, ...options });

const pnpm = run("pnpm --version", { encoding: "utf8" });

if (pnpm.error || pnpm.status !== 0) {
  fail(
    [
      "",
      "pnpm was not found. This project uses pnpm — running npm on it",
      "crashes npm's dependency resolver (arborist) on the pnpm-style",
      "node_modules layout.",
      "",
      "Get pnpm first:",
      "  corepack enable          # Node >= 16.9",
      "  npm install -g pnpm      # or a global install",
      "",
      "Then run:  pnpm setup",
      "",
    ].join("\n"),
  );
}

console.log("");
console.log(`pnpm ${pnpm.stdout.trim()} detected.`);

console.log("");
console.log("Installing dependencies (idempotent, fast with a warm store)...");
const install = run("pnpm install", {
  stdio: "inherit",
  cwd: root,
});
if (install.status !== 0) {
  fail("pnpm install failed — see output above.");
}

if (skipClean) {
  console.log("");
  console.log("Skipping .next clean (--no-clean).");
} else {
  console.log("");
  console.log("Cleaning stale .next to avoid post-crash blank pages...");
  const cleaned = cleanNext(root, { silent: true });
  console.log(
    cleaned
      ? "Removed .next (dev cache, build artifacts, route manifests)."
      : "No .next directory — nothing to clean.",
  );
}

function portBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

const busy = await portBusy(3000);
if (busy) {
  console.log("");
  console.log("Note: port 3000 is already in use. Next.js will pick the");
  console.log("next free port, or another dev server may already be");
  console.log("running for this project.");
}

console.log("");
console.log("Starting the dev server (Ctrl+C to stop)...");
console.log("");

const devCommand = `pnpm dev${forwarded.length ? " " + forwarded.join(" ") : ""}`;
const dev = spawn(devCommand, [], {
  stdio: "inherit",
  cwd: root,
  shell,
});

dev.on("error", (err) => {
  console.error(`Failed to start the dev server: ${err.message}`);
  process.exit(1);
});

dev.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
