# 🚀 PicoTS
### Next-Generation TypeScript-Native Desktop Framework

**PicoTS** is an ultra-lightweight desktop application framework that allows developers to build **sub-megabyte (< 500 KB), zero-dependency native desktop applications using 100% TypeScript from end to end.**

It eliminates the 150MB+ bundle size and high memory bloat of **Electron** while eliminating the steep Rust learning curve of **Tauri**.

---

## ✨ Features

- **⚡ Sub-Megabyte Binaries**: Compiles to a single standalone executable (< 500 KB).
- **🔒 Zero-HTTP Direct In-Memory IPC**: No open ports, no localhost network servers, no firewall prompts.
- **🚀 < 0.08ms Latency**: In-memory Windows COM / WebKit message dispatch.
- **🎨 100% TypeScript**: Write standard TypeScript for both your desktop UI and native backend logic.
- **🖥️ Hardware-Accelerated WebView**: Uses OS-native Microsoft Edge WebView2 on Windows and WebKit on macOS/Linux.
- **🪟 Native OS Capabilities**: Built-in Win32 Open/Save File Dialogs, Modal Alert Boxes, and Frameless Window Management.

---

## 📊 Comparison Matrix

| Metric | Electron | Tauri | **PicoTS** |
| :--- | :---: | :---: | :---: |
| **Backend Language** | JavaScript / TypeScript | Rust | **100% TypeScript** |
| **Backend Runtime** | Node.js + V8 (~150MB) | Native Rust | **Native Machine Code (ScriptC AOT)** |
| **Binary Size** | ~150 MB+ | ~5 MB – 15 MB | **< 1 MB (< 500 KB)** |
| **Cold Start** | 1.5s – 3.0s | 0.2s – 0.5s | **< 0.1s (Instant)** |
| **Network Stack** | HTTP / Mojo Sockets | Custom URI (`ipc://`) | **Zero-HTTP / Direct COM Memory** |
| **IPC Latency** | ~0.5 ms | ~0.3 ms | **< 0.08 ms** |
| **Learning Curve** | Low | High (Requires Rust) | **Zero (Standard TypeScript)** |

---

## 📦 Quickstart

### 1. Create a New App
```bash
bun create picots my-app
# or
npx create-picots my-app
```

### 2. Development Mode
```bash
cd my-app
bun install
bun run dev
```

### 3. Build Production Single Executable
```bash
bun run build
# Outputs dist/my-app.exe (< 500 KB)
```

---

## 🧩 Monorepo Structure

- **[`packages/picots`](./packages/picots)**: The master developer CLI (`picots dev`, `picots build`).
- **[`packages/core`](./packages/core)**: The developer-facing TypeScript Desktop Runtime SDK (`@picots/core`).
- **[`packages/webview`](./packages/webview)**: Native cross-platform WebView host engine (`@picots/webview`).
- **[`packages/create-picots`](./packages/create-picots)**: Scaffolding starter tool (`create-picots`).
- **[`examples/starter-app`](./examples/starter-app)**: Ready-to-run reference application.

---

## 📄 License
MIT © p2pdops
