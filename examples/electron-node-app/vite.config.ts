import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import picots from "@picots/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    picots({
      name: "electron-node-app",
      main: "src/main/index.ts",
      preload: "src/preload/index.ts",
      injectMain: true,
      logging: {
        ipc: true,
        renderer: true,
      },
      window: {
        title: "PicoTS — Electron & Node.js Verification Suite",
        width: 1280,
        height: 800,
        minWidth: 850,
        minHeight: 600,
        resizable: true,
        frameless: true,
      },
    }),
  ],
  resolve: {
    alias: {
      electron: path.resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
  build: {
    outDir: ".picots/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    strictPort: true,
  },
});
