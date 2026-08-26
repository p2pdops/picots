# ❓ Troubleshooting & Frequently Asked Questions (FAQ)

---

## 🛠️ Build & Compilation Issues

### 1. `g++: command not found` or `windres: command not found`
- **Cause**: The C++ compiler toolchain is not found in your system's `PATH`.
- **Solution (Windows)**:
  - Install **MinGW-w64** via MSYS2 or WinLibs:
    ```powershell
    # Via Chocolatey
    choco install mingw
    # Or via winget
    winget install MSYS2.MSYS2
    ```
  - Ensure `C:\msys64\ucrt64\bin` or your MinGW `bin` folder is added to your Environment `PATH`.
- **Solution (macOS)**: Run `xcode-select --install`.
- **Solution (Linux)**: Run `sudo apt install build-essential libwebkit2gtk-4.1-dev`.

---

### 2. `cannot find WebView2LoaderStatic.lib`
- **Cause**: Using an outdated `@picots/webview` package before version `0.0.6`.
- **Solution**: Run `bun update @picots/webview` or ensure your package dependencies reference `"@picots/webview": "^0.0.6"`.

---

### 3. `spawn EINVAL` on Windows during `bun run dev`
- **Cause**: Node.js 20+ security restrictions on `.cmd` invocations without a command processor.
- **Solution**: Upgrade `@picots/vite-plugin` to `>= 0.0.6`, which utilizes `cmd.exe /c` automatically.

---

## 🚀 Performance & Runtime FAQ

### Q: Why is the executable size ~670 KB instead of 150 MB?
**A:** Electron bundles an entire copy of Chromium and Node.js with every application. PicoTS leverages the native OS WebView already built into Windows 10/11 (Microsoft Edge WebView2) and macOS/Linux (WebKit), and compiles TypeScript directly to native machine code.

### Q: Does PicoTS use a localhost HTTP server for IPC?
**A:** **No.** Unlike early desktop wrappers, PicoTS uses direct in-memory message dispatch (`window.chrome.webview.postMessage` over Win32 COM / WebKit message handlers). There are **zero open TCP ports**, zero firewall alerts, and IPC latency is under **0.08 milliseconds**.

### Q: How do I inspect the UI or open DevTools in production?
**A:** Pass `webPreferences: { devTools: true }` in your `BrowserWindow` options. In the desktop window, press **F12** or **Right-Click ➔ Inspect Element** to open Chrome DevTools.

### Q: How do I embed a custom application icon?
**A:** Place your `.ico` icon in `src/assets/icon.ico` and specify the path in `picots.config.json`:
```json
{
  "name": "my-app",
  "icon": "src/assets/icon.ico"
}
```
PicoTS compiles the `.ico` directly into the Windows PE resource directory using `windres`.
