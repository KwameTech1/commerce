import { rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function cleanNext(rootDir, { silent = false } = {}) {
  const nextDir = join(rootDir, ".next");

  if (!existsSync(nextDir)) {
    if (!silent) console.log("No .next directory — nothing to clean.");
    return false;
  }

  rmSync(nextDir, { recursive: true, force: true });
  if (!silent) {
    console.log("Removed .next (dev cache, build artifacts, route manifests).");
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanNext(root);

  console.log("");
  console.log("Next steps:");
  console.log("  pnpm dev      # start the dev server (webpack)");
  console.log(
    "  pnpm build    # production build — run ONLY while dev is stopped",
  );
  console.log("");
  console.log("Recovering from a hung dev server? Make sure all next/node");
  console.log("processes for this project are stopped first, e.g.:");
  console.log("  Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |");
  console.log('    Where-Object { $_.CommandLine -match "commerce" } |');
  console.log("    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }");
}
