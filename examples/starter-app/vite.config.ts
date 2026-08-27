import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import picots from "@picots/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    picots({
      name: "starter-app",
      main: "src/main/index.ts",
      preload: "src/preload/index.ts",
      injectMain: true,
      logging: {
        ipc: true,
        renderer: true,
      },
      window: {
        title: "PicoTS React Desktop",
        width: 1200,
        height: 800,
        minWidth: 700,
        minHeight: 500,
        resizable: true,
        frameless: true,
        icon: "src/assets/icon.ico",
      },
    }),
  ],
  build: {
    outDir: ".picots/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});

