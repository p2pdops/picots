# 📖 PicoTS Core API Reference (`@picots/core`)

This document provides complete documentation and code examples for all modules and classes available in `@picots/core`.

---

## 📑 Table of Contents
1. [`BrowserWindow`](#browserwindow)
2. [`app`](#app)
3. [`ipcMain` & `ipcRenderer`](#ipcmain--ipcrenderer)
4. [`dialog`](#dialog)
5. [`Tray` & `Menu`](#tray--menu)
6. [`clipboard`](#clipboard)
7. [`shell`](#shell)
8. [`Notification`](#notification)

---

## `BrowserWindow`
The `BrowserWindow` class creates and controls desktop application windows.

```typescript
import { BrowserWindow } from "@picots/core";

const win = new BrowserWindow({
  width: 1200,
  height: 800,
  title: "My PicoTS Application",
  resizable: true,
  frame: true,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    devTools: true,
  },
});
```

### Constructor Options
| Option | Type | Default | Description |
| :--- | :--- | :---: | :--- |
| `width` | `number` | `1024` | Initial window width in pixels. |
| `height` | `number` | `768` | Initial window height in pixels. |
| `title` | `string` | `"PicoTS App"` | Window title displayed in the OS titlebar. |
| `resizable` | `boolean` | `true` | Whether the user can resize the window. |
| `frame` | `boolean` | `true` | Set to `false` to create a modern frameless window. |
| `minWidth` | `number` | `undefined` | Minimum allowed window width. |
| `minHeight` | `number` | `undefined` | Minimum allowed window height. |
| `webPreferences.devTools` | `boolean` | `true` | Enable F12 and Right-Click ➔ Inspect Element DevTools. |

### Methods
- **`win.loadURL(url: string)`**: Loads a remote URL or local development server (e.g. `http://localhost:5173`).
- **`win.loadFile(filePath: string)`**: Loads a local HTML file.
- **`win.show()`**: Shows the window if hidden.
- **`win.hide()`**: Hides the window without terminating the application.
- **`win.minimize()`**: Minimizes the window to the taskbar.
- **`win.maximize()`**: Maximizes the window.
- **`win.unmaximize()`**: Restores a maximized window to its previous size.
- **`win.isMaximized(): boolean`**: Returns `true` if the window is currently maximized.
- **`win.close()`**: Closes and destroys the window.
- **`win.webContents.send(channel: string, ...args: any[])`**: Sends an asynchronous message to the renderer process.

### Window Events
```typescript
win.on("ready-to-show", () => {
  win.show();
});

win.on("close", (e) => {
  console.log("Window is closing");
});
```

---

## `app`
Controls your application's lifecycle and system paths.

```typescript
import { app } from "@picots/core";

app.whenReady().then(() => {
  createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
```

### Methods & Properties
- **`app.whenReady(): Promise<void>`**: Resolves when the native WebView engine has initialized.
- **`app.quit()`**: Gracefully shuts down the application and cleans up tray icons.
- **`app.getName(): string`**: Returns the current application name.
- **`app.getPath(name: "home" | "appData" | "temp" | "userData"): string`**: Returns standard OS directory paths.

---

## `ipcMain` & `ipcRenderer`
Ultra-fast, zero-HTTP in-memory message bridge between the Main Process and Renderer Process (< 0.08ms latency).

### Main Process (`src/main/index.ts`)
```typescript
import { ipcMain } from "@picots/core";

// Register an asynchronous handler
ipcMain.handle("system:get-stats", async (event, args) => {
  return {
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
  };
});

// Fire-and-forget message listener
ipcMain.on("app:log", (event, message) => {
  console.log("[Renderer Log]:", message);
});
```

### Renderer Process (`src/renderer/App.tsx`)
```typescript
import { ipcRenderer } from "@picots/core";

// Invoke backend handler and await response
async function fetchStats() {
  const stats = await ipcRenderer.invoke("system:get-stats");
  console.log("System stats:", stats);
}

// Send fire-and-forget event
ipcRenderer.send("app:log", "User clicked dashboard button");
```

---

## `dialog`
Native OS system file pickers, folder dialogs, and message boxes.

```typescript
import { dialog } from "@picots/core";

// Open File Dialog
const result = await dialog.showOpenDialog({
  title: "Select Data File",
  properties: ["openFile", "multiSelections"],
  filters: [
    { name: "JSON & CSV", extensions: ["json", "csv"] },
    { name: "All Files", extensions: ["*"] },
  ],
});

if (!result.canceled) {
  console.log("Selected file paths:", result.filePaths);
}

// Native Message Box
await dialog.showMessageBox({
  type: "info", // "none" | "info" | "error" | "question" | "warning"
  title: "Export Finished",
  message: "Your project was successfully compiled!",
  buttons: ["OK"],
});
```

---

## `Tray` & `Menu`
Create native System Tray icons with right-click context menus.

```typescript
import { app, BrowserWindow, Tray, Menu } from "@picots/core";

let tray: Tray | null = null;

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 });

  tray = new Tray("src/assets/icon.ico");
  tray.setToolTip("PicoTS Desktop App");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open App",
      click: () => win.show(),
    },
    {
      label: "Send Alert",
      click: () => console.log("Alert triggered from Tray"),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Restore window on double-click
  tray.on("double-click", () => {
    win.show();
  });
});
```

---

## `clipboard`
Perform copy and paste operations on the system clipboard.

```typescript
import { clipboard } from "@picots/core";

// Write text to clipboard
clipboard.writeText("Hello from PicoTS!");

// Read text from clipboard
const currentText = clipboard.readText();
console.log("Clipboard contents:", currentText);
```

---

## `shell`
Manage desktop file operations and open external URLs in the user's default browser.

```typescript
import { shell } from "@picots/core";

// Open external website in Chrome/Edge/Safari
await shell.openExternal("https://p2pdops.github.io/picots");

// Reveal file in Windows Explorer / macOS Finder
await shell.showItemInFolder("C:\\Users\\user\\Documents\\report.pdf");
```

---

## `Notification`
Display native OS desktop toast notifications.

```typescript
import { Notification } from "@picots/core";

const notif = new Notification({
  title: "Download Finished",
  body: "Project assets have been saved to your downloads folder.",
  silent: false,
});

notif.show();
```
