import { spawn } from "node:child_process";
import { buildProject, BuildOptions } from "./build.js";

export async function devProject(options: BuildOptions = {}): Promise<void> {
  console.log("⚡ [PicoTS] Launching in development mode...");
  const exePath = await buildProject(options);

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
