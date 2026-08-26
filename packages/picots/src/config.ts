import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PicotsConfig } from "@picots/core";

export function loadConfig(cwd: string = process.cwd()): PicotsConfig {
  const jsonPath = join(cwd, "picots.config.json");
  const pkgPath = join(cwd, "package.json");

  let config: PicotsConfig = {};

  // 1. Check picots.config.json
  if (existsSync(jsonPath)) {
    try {
      const raw = readFileSync(jsonPath, "utf8");
      config = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ [PicoTS] Failed to parse picots.config.json:", err);
    }
  }

  // 2. Default name from package.json if not set
  if (!config.name && existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name) config.name = pkg.name.replace(/[^a-zA-Z0-9_-]/g, "-");
    } catch {}
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
