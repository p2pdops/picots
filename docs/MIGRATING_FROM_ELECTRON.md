# 🚀 Migrating from Electron to PicoTS in 5 Minutes

This guide explains how to migrate existing **Electron** desktop applications to **PicoTS** to achieve **< 1 MB standalone binaries, zero Node.js/V8 bloat, and sub-millisecond IPC performance.**

---

## 📊 Why Migrate?

| Feature | Electron | **PicoTS** |
| :--- | :---: | :---: |
| **Download / Bundle Size** | ~150–200 MB | **< 1 MB (446 KB)** |
| **Memory Consumption** | ~150–300 MB | **~15–25 MB** |
| **Cold Startup Time** | 2.0s – 4.0s | **< 0.1s (Instant)** |
| **Backend Language** | JavaScript / TypeScript | **100% TypeScript (ScriptC AOT)** |
| **IPC Mechanism** | Mojo / Loopback Socket | **Direct In-Memory COM (< 0.08ms)** |

---

## ⚡ 1. Step 1: Update Imports

PicoTS exposes familiar Electron APIs in `@picots/core`:

```diff
- import { app, BrowserWindow, dialog, ipcMain, shell, clipboard } from "electron";
+ import { app, BrowserWindow, dialog, ipcMain, shell, clipboard } from "@picots/core";
```

---

## 🪟 2. Step 2: Main Process Boilerplate

Your main window creation code remains virtually identical:

```ts
import { app, BrowserWindow, ipcMain, dialog } from "@picots/core";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "My Converted Desktop App",
    frameless: true,
  });

  // Handle IPC calls from React / Frontend
  ipcMain.handle("get-user", async (event, userId) => {
    return { id: userId, name: "Alice", role: "Admin" };
  });

  ipcMain.handle("open-file", async () => {
    return await dialog.showOpenDialog(mainWindow, {
      title: "Select Document",
    });
  });
});
```

---

## ⚛️ 3. Step 3: Frontend IPC Invocation

In your React / Vue / Vanilla frontend, invoke registered `ipcMain` channels using `ipcRenderer`:

```ts
import { ipcRenderer } from "@picots/core";

// In your React Component:
async function loadUserData() {
  // Exactly identical to Electron's ipcRenderer.invoke!
  const user = await ipcRenderer.invoke("get-user", "usr_123");
  console.log(user.name); // "Alice"
}
```

---

## ⚙️ 4. Step 4: Add `picots.config.json`

Create a `picots.config.json` file in your project root:

```json
{
  "name": "my-app",
  "window": {
    "title": "My Converted Desktop App",
    "width": 1200,
    "height": 800,
    "frameless": true,
    "icon": "src/assets/icon.ico"
  },
  "build": {
    "outDir": "dist",
    "frontendDir": ".picots/frontend"
  },
  "dev": {
    "url": "http://localhost:5173"
  }
}
```

---

## 🔨 5. Step 5: Build Standalone Executable

```bash
bun run build
# Outputs dist/my-app.exe (< 500 KB single standalone binary)
```

---

## 🧩 Electron API Compatibility Reference

| Electron API | PicoTS Equivalent | Status |
| :--- | :--- | :---: |
| `new BrowserWindow(options)` | `new BrowserWindow(options)` (`@picots/core`) | ✅ Supported |
| `app.whenReady()` | `app.whenReady()` (`@picots/core`) | ✅ Supported |
| `app.quit()` | `app.quit()` (`@picots/core`) | ✅ Supported |
| `app.getPath(name)` | `app.getPath(name)` (`@picots/core`) | ✅ Supported |
| `ipcMain.handle(channel, fn)` | `ipcMain.handle(channel, fn)` (`@picots/core`) | ✅ Supported |
| `ipcRenderer.invoke(channel)` | `ipcRenderer.invoke(channel)` (`@picots/core`) | ✅ Supported |
| `dialog.showOpenDialog(...)` | `dialog.showOpenDialog(...)` (`@picots/core`) | ✅ Supported |
| `dialog.showMessageBox(...)` | `dialog.showMessageBox(...)` (`@picots/core`) | ✅ Supported |
| `clipboard.writeText(text)` | `clipboard.writeText(text)` (`@picots/core`) | ✅ Supported |
| `clipboard.readText()` | `clipboard.readText()` (`@picots/core`) | ✅ Supported |
| `shell.openExternal(url)` | `shell.openExternal(url)` (`@picots/core`) | ✅ Supported |
| `new Tray(iconPath)` | `new Tray(iconPath)` (`@picots/core`) | ✅ Supported |
| `Menu.buildFromTemplate(tmpl)`| `Menu.buildFromTemplate(tmpl)` (`@picots/core`) | ✅ Supported |
