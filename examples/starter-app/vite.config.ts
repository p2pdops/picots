import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import picots from "@picots/vite-plugin";

export default defineConfig({
  plugins: [react(), picots()],
  build: {
    outDir: ".picots/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
