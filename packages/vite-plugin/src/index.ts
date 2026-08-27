import type { Plugin, ViteDevServer } from "vite";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface WindowConfig {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  frameless?: boolean;
  frame?: boolean;
  icon?: string;
}

export interface BuildConfig {
  outDir?: string;
  frontendDir?: string;
  target?: string;
}

export interface DevConfig {
  port?: number;
  url?: string;
}

export interface LoggingConfig {
  /**
   * Enable real-time IPC message logging in console and terminal.
   * @default true in dev mode
   */
  ipc?: boolean;
  /**
   * Forward browser renderer console logs to terminal.
   * @default true
   */
  renderer?: boolean;
}

export interface PicotsViteOptions {
  /**
   * Application name.
   */
  name?: string;
  /**
   * Main process entry point script.
   * If not set, reads from picots.config.json, package.json, or auto-discovers src/main/index.ts.
   */
  main?: string;
  /**
   * Preload bridge entry point script.
   * If not set, reads from picots.config.json or auto-discovers src/preload/index.ts.
   */
  preload?: string;
  /**
   * Window configuration options.
   */
  window?: WindowConfig;
  /**
   * Build output configuration.
   */
  build?: BuildConfig;
  /**
   * Dev server options.
   */
  dev?: DevConfig;
  /**
   * Logging configuration.
   */
  logging?: boolean | LoggingConfig;
  /**
   * Inject main process handlers directly into the frontend bundle in production.
   * Useful for single-binary / unified in-memory apps (like starter-app).
   * For Electron apps with Node native modules (like Prisma/ws), leave false.
   * @default false
   */
  injectMain?: boolean;
  /**
   * Automatically launch the PicoTS desktop window on Vite dev server start.
   * @default true
   */
  autoLaunch?: boolean;
}


export function picots(options: PicotsViteOptions = {}): Plugin {
  let isLaunched = false;
  const virtualModuleId = "/@picots/client-runtime.js";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  // Load picots.config.json if present as base defaults
  let picotsConfig: any = {};
  if (existsSync("picots.config.json")) {
    try {
      picotsConfig = JSON.parse(readFileSync("picots.config.json", "utf8"));
    } catch {}
  }

  // Merge options from vite.config.ts (which take priority over picots.config.json)
  const mergedConfig: PicotsViteOptions = {
    ...picotsConfig,
    ...options,
    window: { ...(picotsConfig.window || {}), ...(options.window || {}) },
    build: { ...(picotsConfig.build || {}), ...(options.build || {}) },
    dev: { ...(picotsConfig.dev || {}), ...(options.dev || {}) },
    logging: options.logging !== undefined ? options.logging : picotsConfig.logging,
  };

  const isLoggingEnabled = mergedConfig.logging !== false;
  const isIpcLogging = typeof mergedConfig.logging === "object" ? mergedConfig.logging.ipc !== false : isLoggingEnabled;
  const isRendererLogging = typeof mergedConfig.logging === "object" ? mergedConfig.logging.renderer !== false : isLoggingEnabled;

  // Determine preload entry
  let preloadEntry = mergedConfig.preload;
  if (!preloadEntry) {
    const candidates = ["src/preload/index.ts", "src/preload.ts", "src/preload/preload.ts", "src/preload/main.ts", "src/preload.js"];
    for (const c of candidates) {
      if (existsSync(c)) {
        preloadEntry = c;
        break;
      }
    }
  }

  // Determine main process entry
  let mainEntry = mergedConfig.main;
  if (!mainEntry) {
    const mainCandidates = ["src/main/index.ts", "src/main.ts", "src/main/main.ts", "src/index.ts"];
    for (const candidate of mainCandidates) {
      if (existsSync(candidate)) {
        mainEntry = candidate;
        break;
      }
    }
  }

  let isDevServer = false;
  let entryFile = "";
  let hasInjectedEntry = false;

  return {
    name: "vite-plugin-picots",

    config(config) {
      return {
        resolve: {
          alias: {
            "electron": "@picots/core",
            "node:crypto": "@picots/core",
            "crypto": "@picots/core",
            "node:fs": "@picots/core",
            "fs": "@picots/core",
            "node:os": "@picots/core",
            "os": "@picots/core",
            "node:path": "@picots/core",
            "path": "@picots/core",
            ...(Array.isArray(config.resolve?.alias) ? {} : config.resolve?.alias || {}),
          },
        },
      };
    },

    configResolved(config) {
      isDevServer = config.command === "serve";
    },

    buildStart() {
      try {
        const tempDir = resolve(process.cwd(), ".picots");
        if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
        writeFileSync(resolve(tempDir, "config.json"), JSON.stringify(mergedConfig, null, 2), "utf8");
      } catch {}
    },

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        let preloadImport = "";
        if (preloadEntry && existsSync(preloadEntry)) {
          preloadImport = `import "${resolve(process.cwd(), preloadEntry).replace(/\\/g, "/")}";`;
        }
        return `window.__PICOTS_IPC_LOGS__ = ${isIpcLogging};\nimport "@picots/core";\n${preloadImport}`;
      }
    },

    transformIndexHtml(html, ctx) {
      if (ctx?.server || isDevServer) {
        return [
          {
            tag: "script",
            attrs: { type: "module", src: virtualModuleId },
            injectTo: "head-prepend",
          },
        ];
      }

      const scriptMatch = html.match(/<script\s+[^>]*src=["']([^"']+)["']/i);
      if (scriptMatch && scriptMatch[1]) {
        entryFile = scriptMatch[1].replace(/^[./\\]+/, "");
      }
      return [];
    },

    transform(code, id) {
      if (!isDevServer && !hasInjectedEntry) {
        const normId = id.replace(/\\/g, "/");
        const isSelfMainOrPreload =
          (mainEntry && normId.endsWith(mainEntry.replace(/\\/g, "/"))) ||
          (preloadEntry && normId.endsWith(preloadEntry.replace(/\\/g, "/")));

        if (!isSelfMainOrPreload) {
          const isEntry =
            (entryFile && normId.endsWith(entryFile)) ||
            normId.endsWith("/main.tsx") ||
            normId.endsWith("/main.ts") ||
            normId.endsWith("/index.tsx");

          if (isEntry) {
            hasInjectedEntry = true;
            let prepend = `window.__PICOTS_IPC_LOGS__ = ${isIpcLogging};\nimport "@picots/core";\n`;
            if (preloadEntry && existsSync(preloadEntry)) {
              prepend += `import "${resolve(process.cwd(), preloadEntry).replace(/\\/g, "/")}";\n`;
            }
            if (mainEntry && existsSync(mainEntry)) {
              prepend += `import "${resolve(process.cwd(), mainEntry).replace(/\\/g, "/")}";\n`;
            }
            return {
              code: prepend + code,
              map: null,
            };
          }
        }
      }
    },

    configureServer(server: ViteDevServer) {
      // Forward browser renderer console logs to terminal if enabled
      if (isRendererLogging) {
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
      }

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
            PICOTS_CONFIG_JSON: JSON.stringify(mergedConfig),
            PICOTS_IPC_LOGS: isIpcLogging ? "true" : "false",
          },
        });

        // Determine main process entry from mergedConfig or package.json
        let mainProc: any = null;
        let mainEntry = mergedConfig.main;
        if (!mainEntry) {
          const mainCandidates = ["src/main/index.ts", "src/main.ts", "src/main/main.ts", "src/index.ts"];
          for (const candidate of mainCandidates) {
            if (existsSync(candidate)) {
              mainEntry = candidate;
              break;
            }
          }
        }

        if (preloadEntry && existsSync(preloadEntry)) {
          console.log(`🌉 [PicoTS] Auto-injected preload bridge: ${preloadEntry}`);
        }

        if (mainEntry && existsSync(mainEntry)) {
          console.log(`⚡ [PicoTS] Spawning main process: ${mainEntry}`);
          mainProc = spawn(isWin ? "cmd.exe" : "bun", isWin ? ["/c", "bun", "run", mainEntry] : ["run", mainEntry], {
            stdio: "inherit",
            env: {
              ...process.env,
              PICOTS_DEV_URL: devUrl,
              NODE_ENV: "development",
              PICOTS_IPC_LOGS: isIpcLogging ? "true" : "false",
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
