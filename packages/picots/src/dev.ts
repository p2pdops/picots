import { spawn } from "node:child_process";
import { buildProject, BuildOptions } from "./build.js";

export interface DevOptions extends BuildOptions {
  devUrl?: string;
}

export async function devProject(options: DevOptions = {}): Promise<void> {
  console.log("⚡ [PicoTS] Launching in development mode...");
  const devUrl = options.devUrl || process.env.PICOTS_DEV_URL || options.config?.dev?.url || "http://localhost:5173";
  const exePath = await buildProject({ ...options, devUrl });

  console.log(`🚀 Spawning application window: ${exePath}`);
  const proc = spawn(exePath, [], {
    stdio: "inherit",
    shell: true,
  });

  proc.on("exit", (code) => {
    console.log(`\n🛑 [PicoTS] App window closed (code: ${code}).`);
    process.exit(0);
  });
}
