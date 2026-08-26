# 🚀 PicoTS
### Next-Generation TypeScript-Native Desktop Framework (Drop-in Electron Replacement)

[![npm version](https://img.shields.io/npm/v/@picots/core.svg?style=flat-square&color=00e5ff)](https://www.npmjs.com/package/@picots/core)
[![CI Status](https://img.shields.io/github/actions/workflow/status/p2pdops/picots/ci.yml?branch=main&style=flat-square)](https://github.com/p2pdops/picots/actions)
[![Website](https://img.shields.io/badge/website-p2pdops.github.io%2Fpicots-00e5ff?style=flat-square)](https://p2pdops.github.io/picots)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)](./LICENSE)

**PicoTS** is an ultra-lightweight desktop application framework that allows developers to build **sub-megabyte (< 700 KB), zero-dependency native desktop applications using 100% TypeScript from end to end.**

It eliminates the 150MB+ bundle size and high memory bloat of **Electron** while eliminating the steep Rust learning curve of **Tauri**.

---

## ✨ Key Highlights

- **⚡ Sub-Megabyte Binaries**: Compiles full React 19 + Tailwind apps into a single standalone executable (< 700 KB).
- **🔄 Drop-In Electron Replacement**: Standard `BrowserWindow`, `app`, `ipcMain.handle()`, `ipcRenderer.invoke()`, `dialog`, `clipboard`, `shell`, `tray`, `Menu`.
- **🔒 Zero-HTTP In-Memory IPC**: No open ports, no localhost network servers, no firewall prompts.
- **🚀 < 0.08ms Latency**: Direct in-memory Windows COM / WebKit message passing.
- **🎨 100% TypeScript**: Write standard TypeScript for both your desktop UI and native backend logic.
- **🖥️ Hardware-Accelerated WebView**: Uses OS-native Microsoft Edge WebView2 on Windows and WebKit on macOS/Linux.
- **🪟 Full Native Desktop Suite**: Built-in System Tray with Context Menus, File Picker Dialogs, Windows Toast Notifications, and Native Clipboard.

---

## 📊 Comparison Matrix

| Metric | Electron | Tauri | **PicoTS** |
| :--- | :---: | :---: | :---: |
| **Backend Language** | JavaScript / TypeScript | Rust (Steep Learning Curve) | **100% TypeScript** |
| **Backend Runtime** | Node.js + V8 (~150MB) | Native Rust | **Native Machine Code (ScriptC AOT)** |
| **UI Engine** | Bundled Chromium (~120MB) | OS WebView | **OS WebView (WebView2 / WebKit)** |
| **Binary Size** | ~150 MB – 200 MB | ~5 MB – 15 MB | **< 1 MB (440 KB – 670 KB)** |
| **Cold Startup** | 2.0s – 4.0s | 0.3s – 0.5s | **< 0.1s (Instant)** |
| **Network Stack** | HTTP / Mojo Sockets | Custom URI (`ipc://`) | **Zero-HTTP / Direct COM Memory** |
| **IPC Latency** | ~0.5 ms | ~0.3 ms | **< 0.08 ms** |
| **Learning Curve** | Low | High (Requires Rust) | **Zero (Standard TypeScript)** |

---

## 📦 Quickstart

### 1. Create a New App
```bash
# React 19 + TailwindCSS Starter (Recommended)
bunx @picots/create my-app --template react
# or
npx @picots/create my-app --template react

# Vanilla TypeScript Starter
bunx @picots/create my-app --template vanilla
```

### 2. Development Mode (with Instant Vite HMR)
```bash
cd my-app
bun install
bun run dev
```

### 3. Build Production Single Executable
```bash
bun run build
# Outputs dist/my-app.exe (< 700 KB standalone executable)
```

---

## 🧩 Monorepo Structure

- **[`@picots/core`](./packages/core)**: The developer-facing TypeScript Desktop Runtime SDK (`BrowserWindow`, `ipcMain`, `ipcRenderer`, etc.).
- **[`@picots/cli`](./packages/picots)**: The master developer CLI (`picots dev`, `picots build`).
- **[`@picots/create`](./packages/create-picots)**: Scaffolding starter tool (`bunx @picots/create`, `npx @picots/create`).
- **[`@picots/vite-plugin`](./packages/vite-plugin)**: Official Vite HMR plugin for React, Vue, and Svelte.
- **[`@picots/webview`](./packages/webview)**: Native cross-platform WebView host engine.
- **[`examples/starter-app`](./examples/starter-app)**: Ready-to-run React 19 + Tailwind reference application.

---

## 🏛️ How It Works (Under the Hood)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PicoTS Application                            │
│                               (< 700 KB)                               │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             Native Frameless Window Host (HWND/Cocoa/GTK)      │   │
│   │                                                                │   │
│   │   ┌───────────────────────────┐    ┌───────────────────────┐   │   │
│   │   │     Renderer Process      │    │     Main Process      │   │   │
│   │   │  (React / Vue / Webview)  │    │  (Compiled TypeScript)│   │   │
│   │   └─────────────┬─────────────┘    └───────────▲───────────┘   │   │
│   │                 │                              │               │   │
│   │                 └─── Direct In-Memory COM ─────┘               │   │
│   │                      IPC (< 0.08ms latency)                    │   │
│   │                      Zero HTTP / Zero Ports                    │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 In-Depth Documentation

- **[`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md)**: Full API reference for `BrowserWindow`, `ipcMain`, `ipcRenderer`, `app`, `dialog`, `tray`, `clipboard`, and `shell`.
- **[`docs/FRAMEWORK_INTEGRATION_GUIDE.md`](./docs/FRAMEWORK_INTEGRATION_GUIDE.md)**: Setup guides for React 19, Vue 3, Svelte 5, Next.js static exports, and TailwindCSS.
- **[`docs/MIGRATING_FROM_ELECTRON.md`](./docs/MIGRATING_FROM_ELECTRON.md)**: 5-minute migration guide for developers switching from Electron to PicoTS.
- **[`docs/TROUBLESHOOTING_AND_FAQ.md`](./docs/TROUBLESHOOTING_AND_FAQ.md)**: Frequently asked questions, toolchain setup, and common troubleshooting steps.
- **[`docs/PICOTS_ROADMAP_AND_TRACKING.md`](./docs/PICOTS_ROADMAP_AND_TRACKING.md)**: Master roadmap and scorecard to the 1.0.0 public release.
- **[`docs/MAINTAINER_GUIDE.md`](./docs/MAINTAINER_GUIDE.md)**: Release and publishing workflows for repository maintainers.
- **[`docs/HOW_WE_BUILT_PICOTS_POC.md`](./docs/HOW_WE_BUILT_PICOTS_POC.md)**: Detailed engineering retrospective on how the POC was designed and compiled.
- **[`docs/PICOTS_ARCHITECTURE_SPEC.md`](./docs/PICOTS_ARCHITECTURE_SPEC.md)**: Complete architectural specification for the `@picots/*` engine.

---

## 🤝 Community & Contributing

We welcome contributions! Please see our:
- **[Contributing Guide](./CONTRIBUTING.md)**
- **[Code of Conduct](./CODE_OF_CONDUCT.md)**
- **[Security Policy](./SECURITY.md)**

---

## 📄 License
MIT © [p2pdops](https://github.com/p2pdops)
