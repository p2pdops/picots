import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildProject } from "./build.js";
import { devProject } from "./dev.js";

function getAppName(): string {
  const pkgPath = join(process.cwd(), "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name) return pkg.name.replace(/[^a-zA-Z0-9_-]/g, "-");
    } catch {}
  }
  return "picots-app";
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const appName = getAppName();

  switch (command) {
    case "build":
      await buildProject({ name: appName });
      break;

    case "dev":
      await devProject({ name: appName });
      break;

    case "version":
    case "-v":
    case "--version":
      console.log("PicoTS CLI v0.1.0");
      break;

    case "help":
    case "-h":
    case "--help":
    default:
      console.log(`
PicoTS — Next-Generation TypeScript-Native Desktop Framework

Usage:
  picots <command> [options]

Commands:
  dev       Start development environment and launch window
  build     Compile unified single-binary executable (< 500 KB)
  version   Show PicoTS version
  help      Show this help message
      `);
      break;
  }
}

main().catch((err) => {
  console.error("PicoTS Error:", err);
  process.exit(1);
});
