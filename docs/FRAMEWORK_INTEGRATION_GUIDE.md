# 🎨 Framework Integration Guide

PicoTS is agnostic to your frontend view library. You can use **React, Vue, Svelte, Solid, Next.js (Static Export), or Vanilla TypeScript**.

---

## ⚛️ 1. React 19 + TailwindCSS (Recommended)

### Scaffolding
```bash
bunx @picots/create my-react-app --template react
cd my-react-app
bun install
```

### Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { picots } from "@picots/vite-plugin";

export default defineConfig({
  plugins: [react(), picots()],
  build: {
    outDir: ".picots/frontend",
  },
});
```

### IPC Bridge Example (`src/renderer/App.tsx`)
```tsx
import React, { useState } from "react";
import { ipcRenderer } from "@picots/core";

export default function App() {
  const [stats, setStats] = useState<any>(null);

  const fetchBackendData = async () => {
    const data = await ipcRenderer.invoke("system:info");
    setStats(data);
  };

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-cyan-400">PicoTS React 19</h1>
      <button 
        onClick={fetchBackendData}
        className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg font-medium"
      >
        Invoke Backend IPC
      </button>
      {stats && <pre className="mt-4 p-4 bg-slate-800 rounded">{JSON.stringify(stats, null, 2)}</pre>}
    </div>
  );
}
```

---

## 🟢 2. Vue 3 + TailwindCSS

### Installation
```bash
bun add vue
bun add -D @vitejs/plugin-vue @picots/vite-plugin @picots/core
```

### Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { picots } from "@picots/vite-plugin";

export default defineConfig({
  plugins: [vue(), picots()],
  build: {
    outDir: ".picots/frontend",
  },
});
```

---

## 🧡 3. Svelte 5

### Installation
```bash
bun add svelte
bun add -D @sveltejs/vite-plugin-svelte @picots/vite-plugin @picots/core
```

### Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { picots } from "@picots/vite-plugin";

export default defineConfig({
  plugins: [svelte(), picots()],
  build: {
    outDir: ".picots/frontend",
  },
});
```

---

## ⚡ 4. Next.js (Static HTML Export)

PicoTS works seamlessly with Next.js applications using Static HTML Export:

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '.picots/frontend',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

### Build & Package
```bash
next build
picots build
```
This inlines your statically exported Next.js pages into a single **< 1 MB standalone desktop executable**!
