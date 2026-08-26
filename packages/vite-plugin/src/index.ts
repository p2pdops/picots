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
