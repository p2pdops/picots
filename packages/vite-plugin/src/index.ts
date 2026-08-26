import type { Plugin, ViteDevServer } from "vite";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export interface PicotsViteOptions {
  /**
   * Main process entry point script.
   * If not set, reads from picots.config.json, package.json, or auto-discovers src/main/index.ts.
   */
  main?: string;
  /**
   * Automatically launch the PicoTS desktop window on Vite dev server start.
   * @default true
   */
  autoLaunch?: boolean;
}

export function picots(options: PicotsViteOptions = {}): Plugin {
  let isLaunched = false;

  return {
    name: "vite-plugin-picots",
    apply: "serve",

    configureServer(server: ViteDevServer) {
      // Forward browser renderer console logs to terminal
      server.ws.on("picots:log", (data: { type: string; message: string }) => {
        const { type, message } = data;
        const timestamp = new Date().toLocaleTimeString();
        if (type === "error") {
          console.error(`\x1b[90m${timestamp}\x1b[0m \x1b[31m[Renderer Error]\x1b[0m ${message}`);
        } else if (type === "warn") {
          console.warn(`\x1b[90m${timestamp}\x1b[0m \x1b[33m[Renderer Warn]\x1b[0m ${message}`);
        } else {
          console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[36m[Renderer Log]\x1b[0m ${message}`);
        }
      });

      if (options.autoLaunch === false) return;

      server.httpServer?.once("listening", () => {
        if (isLaunched) return;
        isLaunched = true;

        const address = server.httpServer?.address();
        const port = typeof address === "object" && address ? address.port : 5173;
        const devUrl = `http://localhost:${port}`;

        console.log(`\n🚀 [PicoTS] Connecting desktop window to Vite HMR: ${devUrl}`);

        // Launch picots dev with --url
        const isWin = process.platform === "win32";
        const command = isWin ? "cmd.exe" : "bun";
        const args = isWin 
          ? ["/c", "bun", "picots", "dev", "--url", devUrl] 
          : ["picots", "dev", "--url", devUrl];

        const proc = spawn(command, args, {
          stdio: "inherit",
          env: {
            ...process.env,
            PICOTS_DEV_URL: devUrl,
          },
        });

        // Determine main process entry from options, picots.config.json, or package.json
        let mainProc: any = null;
        let mainEntry = options.main;
        if (!mainEntry && existsSync("picots.config.json")) {
          try {
            const raw = JSON.parse(readFileSync("picots.config.json", "utf8"));
            if (raw.main) mainEntry = raw.main;
          } catch {}
        }
        if (!mainEntry) {
          const mainCandidates = ["src/main/index.ts", "src/main.ts", "src/main/main.ts", "src/index.ts"];
          for (const candidate of mainCandidates) {
            if (existsSync(candidate)) {
              mainEntry = candidate;
              break;
            }
          }
        }

        if (mainEntry && existsSync(mainEntry)) {
          console.log(`⚡ [PicoTS] Spawning main process: ${mainEntry}`);
          mainProc = spawn(isWin ? "cmd.exe" : "bun", isWin ? ["/c", "bun", "run", mainEntry] : ["run", mainEntry], {
            stdio: "inherit",
            env: {
              ...process.env,
              PICOTS_DEV_URL: devUrl,
              NODE_ENV: "development",
            },
          });
        }

        proc.on("exit", () => {
          if (mainProc) {
            try { mainProc.kill(); } catch {}
          }
          console.log("🛑 [PicoTS] Desktop window closed. Stopping Vite dev server...");
          server.close().then(() => process.exit(0));
        });
      });
    },
  };
}

export default picots;
