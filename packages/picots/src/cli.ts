import { buildProject } from "./build.js";
import { devProject } from "./dev.js";
import { loadConfig } from "./config.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const config = loadConfig(process.cwd());

  let devUrl = process.env.PICOTS_DEV_URL || config.dev?.url;
  const urlIdx = args.indexOf("--url");
  if (urlIdx !== -1 && args[urlIdx + 1]) {
    devUrl = args[urlIdx + 1];
  }

  switch (command) {
    case "build":
      await buildProject({ config });
      break;

    case "dev":
      await devProject({ config, devUrl });
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
