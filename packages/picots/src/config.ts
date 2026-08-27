import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PicotsConfig } from "@picots/core";

export function loadConfig(cwd: string = process.cwd()): PicotsConfig {
  const jsonPath = join(cwd, "picots.config.json");
  const pkgPath = join(cwd, "package.json");

  let config: PicotsConfig = {};

  // 1. Check process.env.PICOTS_CONFIG_JSON (passed dynamically from vite.config.ts)
  if (process.env.PICOTS_CONFIG_JSON) {
    try {
      config = JSON.parse(process.env.PICOTS_CONFIG_JSON);
    } catch {}
  }

  // 2. Check .picots/config.json (generated from vite.config.ts during vite build)
  const tempJsonPath = join(cwd, ".picots", "config.json");
  if (Object.keys(config).length === 0 && existsSync(tempJsonPath)) {
    try {
      const raw = readFileSync(tempJsonPath, "utf8");
      config = JSON.parse(raw);
    } catch {}
  }

  // 3. Check picots.config.json if not provided via env or .picots/
  if (Object.keys(config).length === 0 && existsSync(jsonPath)) {
    try {
      const raw = readFileSync(jsonPath, "utf8");
      config = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ [PicoTS] Failed to parse picots.config.json:", err);
    }
  }

  // 2. Default name and main from package.json if not set
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (!config.name && pkg.name) config.name = pkg.name.replace(/[^a-zA-Z0-9_-]/g, "-");
      if (!config.main && pkg.main) config.main = pkg.main;
    } catch {}
  }

  // 3. Fallback main candidate detection
  if (!config.main) {
    const candidates = ["src/main/index.ts", "src/main.ts", "src/main/main.ts", "src/index.ts"];
    for (const c of candidates) {
      if (existsSync(join(cwd, c))) {
        config.main = c;
        break;
      }
    }
  }

  // 4. Fallback preload candidate detection
  if (!config.preload) {
    const preloadCandidates = ["src/preload/index.ts", "src/preload.ts", "src/preload/main.ts", "src/preload/preload.ts"];
    for (const c of preloadCandidates) {
      if (existsSync(join(cwd, c))) {
        config.preload = c;
        break;
      }
    }
  }

  // Apply sensible defaults
  config.name = config.name || "picots-app";
  config.window = {
    title: config.window?.title || config.name,
    width: config.window?.width || 1180,
    height: config.window?.height || 780,
    minWidth: config.window?.minWidth || 400,
    minHeight: config.window?.minHeight || 300,
    resizable: config.window?.resizable ?? true,
    frameless: config.window?.frameless ?? false,
    icon: config.window?.icon || (existsSync(join(cwd, "src", "assets", "icon.ico")) ? "src/assets/icon.ico" : undefined),
  };

  config.build = {
    outDir: config.build?.outDir || "dist",
    frontendDir: config.build?.frontendDir || "src/frontend",
    target: config.build?.target || "x86_64-windows-gnu",
  };

  return config;
}
