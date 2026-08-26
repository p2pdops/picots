import type { Plugin, ViteDevServer } from "vite";
import { spawn } from "node:child_process";

export interface PicotsViteOptions {
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
        const proc = spawn("bun", ["picots", "dev", "--url", devUrl], {
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            PICOTS_DEV_URL: devUrl,
          },
        });

        proc.on("exit", () => {
          console.log("🛑 [PicoTS] Desktop window closed. Stopping Vite dev server...");
          server.close().then(() => process.exit(0));
        });
      });
    },
  };
}

export default picots;
