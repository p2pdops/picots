# 🔄 Complete Electron API Compatibility & Architectural Audit

This document is the official, transparent scorecard comparing **PicoTS** against the complete API surface of **Electron**. 

PicoTS is designed as an ultra-lightweight (< 700 KB) drop-in replacement for the **essential 80% of Electron APIs** used by modern web/desktop applications, while purposefully avoiding the 150MB+ bundle overhead of bundling full Chromium and Node.js runtimes.

---

## 📊 Summary Compatibility Matrix

```
┌─────────────────────────────────────────────────────────┬──────────────────────┬──────────────────────────────────────────┐
│ Subsystem Category                                      │ Support Status       │ Coverage & Implementation in PicoTS      │
├─────────────────────────────────────────────────────────┼──────────────────────┼──────────────────────────────────────────┤
│ 1. Everyday Core APIs (Window, IPC, Dialogs, Tray)      │ 🟢 Fully Supported   │ 100% Drop-in TypeScript / Win32 / COM    │
│ 2. Preload & Frontend Bridge (window.electronAPI)       │ 🟢 Fully Supported   │ Zero changes required in React/Vue code  │
│ 3. Native OS Integration (Clipboard, Shell, Theme)     │ 🟢 Fully Supported   │ Native OS APIs without Node.js bloat     │
│ 4. Background Updaters & Deep Protocols (myapp://)      │ 🟡 In Progress       │ Planned for v0.2.0 – v1.0.0 milestones   │
│ 5. Deep Chromium Internals (session, desktopCapturer)   │ 🔴 Not Supported     │ Use Web Standards (WebRTC, fetch, WASM)  │
│ 6. Node.js Native C++ Addons (.node binary modules)     │ 🔴 Not Supported     │ Use Pure WebAssembly / Pure TypeScript   │
└─────────────────────────────────────────────────────────┴──────────────────────┴──────────────────────────────────────────┘
```

---

## 🟢 1. Fully Supported Electron Modules (The Essential Core)

These modules cover the functionality required by the vast majority of desktop SaaS applications, dashboards, tools, and offline desktop software.

| Electron Module | PicoTS Equivalent | Status | Details |
| :--- | :--- | :---: | :--- |
| **`BrowserWindow`** | `BrowserWindow` | 🟢 Supported | Window framing, sizing (`setSize`, `getSize`), positioning (`setPosition`, `getPosition`), `center()`, `minimize()`, `maximize()`, `close()`, `setAlwaysOnTop()`, `setOpacity()`, `setMinimumSize()`, `setMaximumSize()`, `setFullScreen()`. |
| **`app`** | `app` | 🟢 Supported | Lifecycle (`whenReady()`, `quit()`, `exit()`), metadata (`getName()`, `getVersion()`), paths (`getPath("userData")`, `appData`, `home`, `temp`), single-instance lock (`requestSingleInstanceLock()`). |
| **`ipcMain`** | `ipcMain` | 🟢 Supported | Two-way async IPC (`ipcMain.handle(ch, fn)`), fire-and-forget (`ipcMain.on(ch, fn)`), `removeHandler()`, `removeAllListeners()`. |
| **`ipcRenderer`** | `ipcRenderer` | 🟢 Supported | `ipcRenderer.invoke(ch, ...args)`, `ipcRenderer.send()`, `ipcRenderer.on()`, `ipcRenderer.removeListener()`. |
| **`contextBridge`** | Automatic `window.electronAPI` | 🟢 Supported | Automatically exposes `window.electronAPI`, `window.picotsAPI`, and `window.ipcRenderer` globally in the browser environment. |
| **`dialog`** | `dialog` | 🟢 Supported | Native `showOpenDialog()` (files & folders), `showSaveDialog()`, `showMessageBox()` (info, error, warning modals). |
| **`Tray` & `Menu`** | `Tray` & `Menu` | 🟢 Supported | System notification tray icons (`new Tray(ico)`), tooltips (`setToolTip()`), right-click menus (`Menu.buildFromTemplate()`). |
| **`clipboard`** | `clipboard` | 🟢 Supported | System clipboard operations (`readText()`, `writeText()`, `clear()`). |
| **`shell`** | `shell` | 🟢 Supported | `openExternal(url)` (opens default browser), `showItemInFolder(path)`, `openPath(path)`, `beep()`. |
| **`Notification`** | `Notification` | 🟢 Supported | Native desktop toast alerts (`new Notification({ title, body }).show()`). |
| **`screen`** | `screen` | 🟢 Supported | Multi-monitor display queries (`getPrimaryDisplay()`, `getAllDisplays()`, `getCursorScreenPoint()`). |
| **`nativeTheme`** | `nativeTheme` | 🟢 Supported | OS dark/light mode detection (`shouldUseDarkColors`, `themeSource`, `on("updated")`). |
| **`globalShortcut`** | `globalShortcut` | 🟢 Supported | Global keyboard hotkeys (`register("Ctrl+Shift+K", cb)`). |
| **`webFrame`** | `webFrame` | 🟢 Supported | Zoom scale and DPI factor adjustments (`setZoomFactor()`). |

---

## 🟡 2. Roadmap Modules (Planned for v0.2.0 – v1.0.0)

| Module | What It Does in Electron | Status in PicoTS | Roadmap Milestone |
| :--- | :--- | :---: | :--- |
| **`protocol`** | Custom virtual URI schemes (`app://bundle/*`) | 🟡 In Progress | Milestone 6 (Custom WebView2/WebKit WebResourceInterception). |
| **`autoUpdater`** | Background binary delta updates | 🟡 Planned | v1.0.0 (GitHub Releases auto-updater). |
| **`powerMonitor`** | OS sleep / wake / battery broadcast events | 🟡 Planned | v0.2.0 (Win32 `WM_POWERBROADCAST`). |
| **`powerSaveBlocker`** | Prevent OS sleep during active tasks | 🟡 Planned | v0.2.0 (Win32 `SetThreadExecutionState`). |
| **`webContents.print`** | Silent hardware printing without OS dialog | 🟡 In Progress | v0.2.0 (Direct WebView2 `PrintAsync` / `winspool.drv`). |

---

## 🔴 3. Unsupported Electron Modules (Specialized Chromium Internals)

Because PicoTS uses OS-native WebViews (WebView2 / WebKit) instead of embedding a custom 120MB Chromium binary, the following internal Chromium engine hooks are not provided:

| Unsupported Module | Why It's Not Supported | Recommended Alternative in PicoTS |
| :--- | :--- | :--- |
| **`session` & `cookies`** | Hooks directly into Chromium's custom C++ network session stack. | Use standard Web `fetch()`, `localStorage`, `IndexedDB`, or native backend requests. |
| **`desktopCapturer`** | Chromium internal screen & audio recorder for apps like Discord/OBS. | Use Web Standard `navigator.mediaDevices.getDisplayMedia()`. |
| **`contentTracing` & `netLog`** | Chromium diagnostic logging tools. | Use PicoTS live terminal console logger or standard OS loggers. |
| **`safeStorage`** | Electron's wrapper for OS DPAPI/Keychain. | Use standard `node:crypto` with local key derivation or OS DPAPI bindings. |
| **`nativeImage`** | Chromium in-memory C++ bitmap image processor. | Use Web Canvas API, `sharp` (via CLI/WASM), or `@squoosh/lib`. |
| **`utilityProcess`** | Spawning child Node.js processes via MessagePort. | Use standard `node:child_process` (`spawn`, `exec`) or Web Workers. |
| **`WebContentsView` / `View`** | Complex nested Chromium sub-view hierarchy. | Use standard modern frontend components (CSS Grid, Flexbox, iframes). |
| **`TouchBar` & `ShareMenu`** | Proprietary Apple MacBook TouchBar hardware APIs. | Deprecated by Apple on modern MacBooks; use in-app UI controls. |
| **`inAppPurchase`** | Apple/Microsoft App Store billing subsystem. | Use web-based payment providers (Stripe, LemonSqueezy, Razorpay). |

---

## ⚠️ 4. Node.js Native C++ Addons (`.node` Binaries)

In Electron, developers sometimes install packages that contain precompiled C++ binaries built against the Node.js V8 C++ ABI (e.g. `better-sqlite3`, `node-pty`, `serialport`).

### The Difference:
- **Electron**: Bundles Node.js runtime headers and requires `electron-rebuild` when Node ABI versions change.
- **PicoTS**: Has **zero Node.js runtime overhead** (< 700 KB standalone binary). Therefore, precompiled `.node` binary addons cannot run directly.

### Recommended Alternatives:
| Electron Pattern | PicoTS Recommended Alternative |
| :--- | :--- |
| `better-sqlite3` (`.node` addon) | **`@sqlite.org/sqlite-wasm`** or **`sql.js`** (Pure WebAssembly, 100% portable, zero compilation). |
| `sharp` (`.node` image processing) | **`@squoosh/lib`** (WASM) or standard HTML5 Canvas / WebCodecs. |
| `serialport` (`.node` hardware driver) | **Web Serial API** (`navigator.serial`) in WebView2, or native Win32 COM stream. |
| `node-pty` (`.node` terminal emulator) | **`xterm.js`** frontend connected over IPC to OS shell (`child_process.spawn("cmd.exe")`). |

---

## 🎯 Final Verdict: Is PicoTS Compatible for Your App?

- **YES (Instant Drop-In Replacement)**: If your application is a React, Vue, Svelte, or Vanilla TypeScript desktop app using standard window management, IPC communication, file dialogs, system tray, notifications, offline storage, and web APIs.
- **NO (Requires Adaptation)**: If your application is an audio/screen streaming recorder (like OBS/Discord requiring `desktopCapturer`) or heavily depends on closed-source `.node` native C++ binary addons that cannot be replaced with WebAssembly or pure TypeScript.
