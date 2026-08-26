# 🚀 PicoTS
### Next-Generation TypeScript-Native Desktop Framework

[![Website](https://img.shields.io/badge/website-p2pdops.github.io%2Fpicots-00e5ff?style=flat-square)](https://p2pdops.github.io/picots)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)](https://opensource.org/licenses/MIT)

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
| **UI Engine** | Bundled Chromium (~120MB) | OS WebView | **OS WebView (WebView2 / WebKit)** |
| **Binary Size** | ~150 MB+ | ~5 MB – 15 MB | **< 1 MB (< 500 KB)** |
| **Cold Start** | 1.5s – 3.0s | 0.2s – 0.5s | **< 0.1s (Instant)** |
| **Network Stack** | HTTP / Mojo Sockets | Custom URI (`ipc://`) | **Zero-HTTP / Direct COM Memory** |
| **IPC Latency** | ~0.5 ms | ~0.3 ms | **< 0.08 ms** |
| **Learning Curve** | Low | High (Requires Rust) | **Zero (Standard TypeScript)** |

---

## 📦 Quickstart

### 1. Create a New App
```bash
# Vanilla TypeScript Starter
bun create @picots my-app
# or
npx @picots/create my-app

# React + Tailwind Starter
bun create @picots my-app --template react
# or
npx @picots/create my-app --template react
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

- **[`packages/core`](./packages/core)**: The developer-facing TypeScript Desktop Runtime SDK (`@picots/core`).
- **[`packages/cli`](./packages/picots)**: The master developer CLI (`@picots/cli` providing `picots dev`, `picots build`).
- **[`packages/vite-plugin`](./packages/vite-plugin)**: Official Vite HMR plugin for React, Vue, and Svelte (`@picots/vite-plugin`).
- **[`packages/webview`](./packages/webview)**: Native cross-platform WebView host engine (`@picots/webview`).
- **[`packages/create`](./packages/create-picots)**: Scaffolding starter tool (`@picots/create`).
- **[`examples/starter-app`](./examples/starter-app)**: Ready-to-run reference application.

---


---

## 🏛️ How It Works (Under the Hood)

PicoTS combines two cutting-edge technologies to create the optimal desktop architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PicoTS Application                            │
│                               (< 500 KB)                               │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             Native Frameless Window Host (HWND/Cocoa/GTK)      │   │
│   │                                                                │   │
│   │  [—] [▢] [✕] Custom Titlebar   -webkit-app-region: drag        │   │
│   │                                                                │   │
│   │  ┌──────────────────────────────────────────────────────────┐  │   │
│   │  │             Hardware-Accelerated OS WebView              │  │   │
│   │  │             (Edge WebView2 / Apple WebKit)               │  │   │
│   │  │                                                          │  │   │
│   │  │   HTML5 / Modern CSS / Frontend JS / React / Vue / Svelte│  │   │
│   │  │   (Loaded 100% in-memory — Zero HTTP server, 0 ports)    │  │   │
│   │  └──────────────────────────┬───────────────────────────────┘  │   │
│   └─────────────────────────────┼──────────────────────────────────┘   │
│                                 │ Direct Win32 COM / WebKit IPC        │
│                                 │ (< 0.08ms In-Memory Roundtrip)       │
│   ┌─────────────────────────────▼──────────────────────────────────┐   │
│   │          Native TypeScript Backend (Compiled via ScriptC)      │   │
│   │                                                                │   │
│   │   • 100% TypeScript source code                                │   │
│   │   • AOT compiled to native machine code via LLVM (scriptc)     │   │
│   │   • Zero Node.js / Zero V8 engine in backend process           │   │
│   │   • Direct Win32 / POSIX OS API integration                    │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. [ScriptC](https://github.com/vercel-labs/scriptc) (TypeScript-to-Native AOT Compiler)
Instead of embedding a bulky JavaScript engine (Node.js/V8) in the backend, PicoTS uses **[`scriptc`](https://github.com/vercel-labs/scriptc)** to compile TypeScript statically into **LLVM IR and pure machine code**:
- **Zero V8 / Zero Node runtime overhead**: Reduces backend memory to ~15MB.
- **Instant cold start**: Executes directly as native machine code in < 100ms.
- **100% TypeScript**: Full static type-checking and autocompletion with zero Rust required.

### 2. [Webview](https://github.com/webview/webview) (OS-Native Embedded Web Rendering)
Instead of packaging a 120MB+ Chromium browser, PicoTS uses **[`webview`](https://github.com/webview/webview)** to embed the user's pre-installed OS browser engine:
- **Windows**: Microsoft Edge WebView2 (`WebView2LoaderStatic.lib`)
- **macOS**: Apple WebKit (`WKWebView` + Cocoa `NSWindow`)
- **Linux**: WebKitGTK (`webkit2gtk-4.1` + GTK3/4)

### 3. Zero-HTTP In-Memory IPC
PicoTS completely eliminates localhost HTTP servers (`http://127.0.0.1:PORT`):
- The entire frontend UI (HTML, CSS, JS) is inlined directly into binary memory and loaded via `set_html()`.
- Communication happens directly over **Windows COM message passing** (`window.chrome.webview.postMessage`) and WebKit handlers.
- **Zero open ports, zero firewall warnings, zero port collisions (`EADDRINUSE`)**, and ultra-low roundtrip latency (**< 0.08 ms**).

---

## 📚 In-Depth Documentation

- **[`docs/PICOTS_ROADMAP_AND_TRACKING.md`](./docs/PICOTS_ROADMAP_AND_TRACKING.md)**: Master direction, architectural scorecards, and roadmap to the 1.0.0 public release.
- **[`docs/MIGRATING_FROM_ELECTRON.md`](./docs/MIGRATING_FROM_ELECTRON.md)**: 5-minute migration guide for developers switching from Electron to PicoTS.
- **[`docs/HOW_WE_BUILT_PICOTS_POC.md`](./docs/HOW_WE_BUILT_PICOTS_POC.md)**: Detailed step-by-step engineering retrospective explaining how the proof-of-concept was designed, compiled, and benchmarked.
- **[`docs/PICOTS_ARCHITECTURE_SPEC.md`](./docs/PICOTS_ARCHITECTURE_SPEC.md)**: Complete architectural specification for the `@picots/*` ecosystem and 1.0 roadmap.

---

## 🔗 References & Prior Art

- **[ScriptC](https://github.com/vercel-labs/scriptc)** — TypeScript/JavaScript to native and WebAssembly compiler by Vercel Labs.
- **[Webview](https://github.com/webview/webview)** — Tiny cross-platform single-header C/C++ library to build modern desktop GUIs using OS webviews.
- **[Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)** — Microsoft's native Chromium-based embedded browser control.
- **[Tauri](https://tauri.app)** & **[Electron](https://www.electronjs.org)** — Foundational inspirations for modern desktop application architecture.

---

## 📄 License
MIT © p2pdops
