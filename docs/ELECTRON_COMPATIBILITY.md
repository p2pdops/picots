# 🔄 Electron API Compatibility & Architecture Scorecard

This document tracks **Electron API compatibility in PicoTS**. It provides an unbiased, general-purpose comparison of Electron APIs and their equivalents in PicoTS for building desktop applications.

---

## 📊 Summary Compatibility Matrix

```
┌─────────────────────────────────────────────────────────┬──────────────────────┬──────────────────────────────────────────┐
│ Subsystem                                               │ Compatibility Level  │ Implementation in PicoTS (v0.0.8)        │
├─────────────────────────────────────────────────────────┼──────────────────────┼──────────────────────────────────────────┤
│ 1. Window Lifecycle & Bounds (BrowserWindow, app)       │ 🟢 98% (Full)        │ Drop-in TypeScript classes with Win32    │
│ 2. Zero-HTTP In-Memory IPC (ipcMain, ipcRenderer)       │ 🟢 100% (Full)       │ Direct COM memory dispatch (< 0.08ms)    │
│ 3. Global window.electronAPI Preload Bridge             │ 🟢 100% (Full)       │ Automatic global bridge on window        │
│ 4. Native System Dialogs & Shell Integration            │ 🟢 100% (Full)       │ Win32 IFileDialog, ShellExecuteEx        │
│ 5. System Tray & Context Menus                          │ 🟢 95% (Full)        │ Win32 TrackPopupMenu + Tray subclassing  │
│ 6. Multi-Monitor Display Queries (screen)               │ 🟢 100% (Full)       │ Primary & all connected display bounds   │
│ 7. Global Hotkeys & Native Theme (globalShortcut)       │ 🟢 100% (Full)       │ System-wide accelerators & Dark Mode sync│
│ 8. Single-Instance Lock & Deep Linking (myapp://)       │ 🟢 100% (Full)       │ Named mutex & Registry protocol client   │
│ 9. Printing & PDF Export (webContents.print)            │ 🟢 90% (High)        │ Silent & dialog print + PDF export       │
└─────────────────────────────────────────────────────────┴──────────────────────┴──────────────────────────────────────────┘
```

---

## 🏛️ 1. Main Process Modules (Backend)

### 1.1 `app` (Application Lifecycle & Metadata)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `app.whenReady()` | `app.whenReady()` | ✅ Supported | Returns a Promise resolving on native window host ready. |
| `app.on('ready', cb)` | `app.on('ready', cb)` | ✅ Supported | Standard EventEmitter pattern. |
| `app.quit()` | `app.quit()` | ✅ Supported | Gracefully terminates message loop and destroys windows. |
| `app.exit(code)` | `app.exit(code)` | ✅ Supported | Immediate process termination. |
| `app.relaunch(options)` | `app.relaunch(options)` | ✅ Supported | Restarts the application process. |
| `app.getPath(name)` | `app.getPath(name)` | ✅ Supported | Supports `'userData'`, `'appData'`, `'home'`, `'temp'`, `'desktop'`, `'documents'`, `'downloads'`. |
| `app.getName()` | `app.getName()` | ✅ Supported | Returns application name from `picots.config.json`. |
| `app.getVersion()` | `app.getVersion()` | ✅ Supported | Returns app version from `package.json`. |
| `app.requestSingleInstanceLock()` | `app.requestSingleInstanceLock()` | ✅ Supported | Manages single instance application lock. |
| `app.setAsDefaultProtocolClient(scheme)` | `app.setAsDefaultProtocolClient(scheme)` | ✅ Supported | OS custom URI protocol registration (`myapp://`). |
| `app.setLoginItemSettings(settings)` | `app.setLoginItemSettings(settings)` | ✅ Supported | OS Startup auto-launch settings. |

---

### 1.2 `BrowserWindow` (Window Management & Positioning)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `new BrowserWindow(options)` | `new BrowserWindow(options)` | ✅ Supported | Supports `width`, `height`, `x`, `y`, `title`, `frame`, `resizable`, `opacity`, `devTools`. |
| `win.loadURL(url)` | `win.loadURL(url)` | ✅ Supported | Connects to remote or local Vite dev servers. |
| `win.loadFile(filePath)` | `win.loadFile(filePath)` | ✅ Supported | Loads local HTML files. |
| `win.setSize(w, h)` | `win.setSize(w, h)` | ✅ Supported | Sets window dimensions dynamically. |
| `win.getSize()` | `win.getSize()` | ✅ Supported | Returns `[width, height]`. |
| `win.setPosition(x, y)` | `win.setPosition(x, y)` | ✅ Supported | Sets window coordinates on screen. |
| `win.getPosition()` | `win.getPosition()` | ✅ Supported | Returns `[x, y]`. |
| `win.center()` | `win.center()` | ✅ Supported | Centers window on screen. |
| `win.setAlwaysOnTop(flag)` | `win.setAlwaysOnTop(flag)` | ✅ Supported | Keeps window above all other windows. |
| `win.setOpacity(opacity)` | `win.setOpacity(opacity)` | ✅ Supported | Adjusts window transparency (0.0 – 1.0). |
| `win.setMinimumSize(w, h)` | `win.setMinimumSize(w, h)` | ✅ Supported | Enforces minimum resize limits. |
| `win.setMaximumSize(w, h)` | `win.setMaximumSize(w, h)` | ✅ Supported | Enforces maximum resize limits. |
| `win.setResizable(flag)` | `win.setResizable(flag)` | ✅ Supported | Toggles window resize handles. |
| `win.setMovable(flag)` | `win.setMovable(flag)` | ✅ Supported | Toggles window drag mobility. |
| `win.show()` | `win.show()` | ✅ Supported | Displays the desktop window. |
| `win.hide()` | `win.hide()` | ✅ Supported | Hides window without terminating process. |
| `win.minimize()` | `win.minimize()` | ✅ Supported | Minimizes window to taskbar. |
| `win.maximize()` | `win.maximize()` | ✅ Supported | Maximizes window. |
| `win.unmaximize()` | `win.unmaximize()` | ✅ Supported | Restores maximized window. |
| `win.isMaximized()` | `win.isMaximized()` | ✅ Supported | Queries window placement status. |
| `win.setFullScreen(flag)` | `win.setFullScreen(flag)` | ✅ Supported | Toggles fullscreen mode. |
| `win.isFullScreen()` | `win.isFullScreen()` | ✅ Supported | Returns fullscreen status. |
| `win.flashFrame(flag)` | `win.flashFrame(flag)` | ✅ Supported | Flashes taskbar icon for user attention. |
| `win.focus()`, `win.blur()` | `win.focus()`, `win.blur()` | ✅ Supported | Manages window focus state. |
| `win.close()` | `win.close()` | ✅ Supported | Destroys window and emits `'closed'`. |

---

### 1.3 `webContents` (Web Engine & Printing)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `webContents.send(channel, ...args)` | `webContents.send(channel, ...args)` | ✅ Supported | Direct in-memory COM message passing to webview. |
| `webContents.openDevTools()` | `webPreferences: { devTools: true }` | ✅ Supported | F12 / Right-click Inspect built-in. |
| `webContents.print(options, cb)` | `webContents.print(options, cb)` | ✅ Supported | Native document printing. |
| `webContents.printToPDF(options)` | `webContents.printToPDF(options)` | ✅ Supported | PDF document export. |
| `webContents.getPrintersAsync()` | `webContents.getPrintersAsync()` | ✅ Supported | Queries installed system printers. |
| `webContents.setZoomFactor(factor)` | `webContents.setZoomFactor(factor)` | ✅ Supported | Adjusts CSS zoom scale. |
| `webContents.reload()` | `webContents.reload()` | ✅ Supported | Reloads the active web view. |

---

### 1.4 `screen` (Multi-Monitor Displays)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `screen.getPrimaryDisplay()` | `screen.getPrimaryDisplay()` | ✅ Supported | Returns Primary monitor bounds, workArea, scaleFactor. |
| `screen.getAllDisplays()` | `screen.getAllDisplays()` | ✅ Supported | Returns all connected monitor displays. |
| `screen.getCursorScreenPoint()` | `screen.getCursorScreenPoint()` | ✅ Supported | Returns absolute mouse cursor coordinates (`{ x, y }`). |
| `screen.getDisplayNearestPoint(point)`| `screen.getDisplayNearestPoint(point)`| ✅ Supported | Returns display closest to screen coordinates. |

---

### 1.5 `globalShortcut` & `nativeTheme`
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `globalShortcut.register(accel, cb)`| `globalShortcut.register(accel, cb)`| ✅ Supported | System-wide keyboard shortcuts (`"Ctrl+Shift+K"`). |
| `globalShortcut.isRegistered(accel)` | `globalShortcut.isRegistered(accel)` | ✅ Supported | Checks if accelerator is registered. |
| `globalShortcut.unregister(accel)` | `globalShortcut.unregister(accel)` | ✅ Supported | Unregisters specific shortcut. |
| `globalShortcut.unregisterAll()` | `globalShortcut.unregisterAll()` | ✅ Supported | Cleans up all shortcuts. |
| `nativeTheme.shouldUseDarkColors` | `nativeTheme.shouldUseDarkColors` | ✅ Supported | Detects if OS is in Dark Mode. |
| `nativeTheme.themeSource` | `nativeTheme.themeSource` | ✅ Supported | Overrides theme (`"system" \| "light" \| "dark"`). |
| `nativeTheme.on('updated', cb)` | `nativeTheme.on('updated', cb)` | ✅ Supported | Listens for OS theme preference changes. |

---

### 1.6 `ipcMain` (Main Process IPC)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `ipcMain.handle(channel, listener)` | `ipcMain.handle(channel, listener)` | ✅ Supported | Asynchronous request-response bridge (< 0.08ms latency). |
| `ipcMain.on(channel, listener)` | `ipcMain.on(channel, listener)` | ✅ Supported | Fire-and-forget message listener. |
| `ipcMain.removeHandler(channel)` | `ipcMain.removeHandler(channel)` | ✅ Supported | Unregisters channel handler. |
| `ipcMain.removeAllListeners(channel)` | `ipcMain.removeAllListeners(channel)` | ✅ Supported | Cleans up channel listeners. |

---

### 1.7 `dialog` (Native System Dialogs)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `dialog.showOpenDialog(options)` | `dialog.showOpenDialog(options)` | ✅ Supported | Native Win32 `IFileOpenDialog` with multi-select and filters. |
| `dialog.showSaveDialog(options)` | `dialog.showSaveDialog(options)` | ✅ Supported | Native Win32 `IFileSaveDialog`. |
| `dialog.showMessageBox(options)` | `dialog.showMessageBox(options)` | ✅ Supported | Native Win32 `MessageBoxW` with OK, Cancel, Yes, No. |
| `dialog.showErrorBox(title, content)` | `dialog.showErrorBox(title, content)` | ✅ Supported | Native modal error dialog. |

---

### 1.8 `Tray` & `Menu` (System Tray & Context Menus)
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `new Tray(iconPath)` | `new Tray(iconPath)` | ✅ Supported | Win32 `Shell_NotifyIconW` with custom `.ico`. |
| `tray.setToolTip(text)` | `tray.setToolTip(text)` | ✅ Supported | Sets taskbar tray hover tooltip. |
| `tray.setContextMenu(menu)` | `tray.setContextMenu(menu)` | ✅ Supported | Win32 `TrackPopupMenu` on right-click. |
| `tray.destroy()` | `tray.destroy()` | ✅ Supported | Removes icon from Windows notification area. |
| `Menu.buildFromTemplate(items)` | `Menu.buildFromTemplate(items)` | ✅ Supported | Supports labels, click handlers, separators, disabled items. |

---

### 1.9 `clipboard`, `shell` & `Notification`
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `clipboard.readText()` | `clipboard.readText()` | ✅ Supported | Win32 `GetClipboardData(CF_UNICODETEXT)`. |
| `clipboard.writeText(text)` | `clipboard.writeText(text)` | ✅ Supported | Win32 `SetClipboardData(CF_UNICODETEXT)`. |
| `clipboard.clear()` | `clipboard.clear()` | ✅ Supported | Win32 `EmptyClipboard()`. |
| `shell.openExternal(url)` | `shell.openExternal(url)` | ✅ Supported | Opens URL in user's default web browser (`ShellExecuteW`). |
| `shell.showItemInFolder(path)` | `shell.showItemInFolder(path)` | ✅ Supported | Highlights file in OS file manager. |
| `shell.openPath(path)` | `shell.openPath(path)` | ✅ Supported | Opens file with associated default system app. |
| `shell.beep()` | `shell.beep()` | ✅ Supported | Win32 `MessageBeep(MB_OK)`. |
| `new Notification(options).show()` | `new Notification(options).show()` | ✅ Supported | Native OS desktop notification toast. |

---

## 🎨 2. Renderer Process & Global Preload Bridge

### 2.1 `window.electronAPI` & `ipcRenderer`
| Electron API | PicoTS Equivalent | Status | Implementation Notes |
| :--- | :--- | :---: | :--- |
| `window.electronAPI.invoke(ch, ...args)` | `window.electronAPI.invoke(ch, ...args)` | ✅ Supported | Automatic global bridge; zero frontend code changes needed. |
| `window.electronAPI.send(ch, ...args)` | `window.electronAPI.send(ch, ...args)` | ✅ Supported | Asynchronous fire-and-forget message to Main Process. |
| `window.electronAPI.on(ch, cb)` | `window.electronAPI.on(ch, cb)` | ✅ Supported | Listens for backend `webContents.send()` events. |
| `ipcRenderer.invoke(channel, ...args)` | `ipcRenderer.invoke(channel, ...args)` | ✅ Supported | Dispatches over in-memory COM memory; returns a Promise. |
| `ipcRenderer.send(channel, ...args)` | `ipcRenderer.send(channel, ...args)` | ✅ Supported | Asynchronous fire-and-forget message. |
| `ipcRenderer.on(channel, listener)` | `ipcRenderer.on(channel, listener)` | ✅ Supported | Listens for backend events. |
| `ipcRenderer.removeListener(ch, cb)` | `ipcRenderer.removeListener(ch, cb)` | ✅ Supported | Removes event listener. |

---

## 🔌 3. Node.js & Embedded Storage Integration

| Subsystem | Usage in Desktop Apps | PicoTS Support | Why PicoTS is Better |
| :--- | :--- | :---: | :--- |
| **SQLite / Embedded DBs** | Local offline data storage | ✅ Full Support | **Zero ABI Rebuild Nightmare!** Electron requires `electron-rebuild` when Node ABI changes; PicoTS links directly with 0 rebuild friction. |
| **`fs` / File System** | Exporting files, user settings | ✅ Full Support | Standard TypeScript `node:fs` or `@picots/core/fs`. |
| **`crypto`** | Hashing, tokens, encryption | ✅ Full Support | Standard `node:crypto` / OS UUID APIs. |
| **`child_process`** | Spawning CLI utilities | ✅ Full Support | Standard `node:child_process`. |
