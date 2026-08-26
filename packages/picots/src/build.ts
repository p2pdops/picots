import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { inlineAssetsToHeader } from "./inliner.js";
import { loadConfig } from "./config.js";
import { webviewPaths } from "@picots/webview";
import type { PicotsConfig } from "@picots/core";

export interface BuildOptions {
  cwd?: string;
  config?: PicotsConfig;
  devUrl?: string;
}

export async function buildProject(options: BuildOptions = {}): Promise<string> {
  const cwd = options.cwd || process.cwd();
  const config = options.config || loadConfig(cwd);
  const devUrl = options.devUrl || process.env.PICOTS_DEV_URL || config.dev?.url;

  const appName = config.name || "picots-app";
  const winConfig = config.window || {};
  const buildConfig = config.build || {};

  const outDir = resolve(cwd, buildConfig.outDir || "dist");
  let frontendDir = resolve(cwd, buildConfig.frontendDir || "src/frontend");
  const tempDir = resolve(cwd, ".picots");

  // If frontendDir does not exist but a vite build output exists (e.g. dist-frontend or dist/client)
  if (!existsSync(frontendDir)) {
    if (existsSync(resolve(cwd, "dist-frontend"))) {
      frontendDir = resolve(cwd, "dist-frontend");
    } else if (existsSync(resolve(cwd, "build"))) {
      frontendDir = resolve(cwd, "build");
    }
  }

  console.log(`\n🚀 [PicoTS] Building ${appName}...`);
  console.log(`   📐 Window: ${winConfig.width}x${winConfig.height} ("${winConfig.title}")`);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  // 1. Terminate any previous instance to release Windows file locks
  if (process.platform === "win32") {
    try {
      execSync(`powershell -Command "Get-Process ${appName} -ErrorAction SilentlyContinue | Stop-Process -Force"`, {
        stdio: "ignore",
      });
    } catch {}
  }

  // 2. Inline UI assets
  console.log("🎨 Inlining frontend UI assets into in-memory header...");
  const embeddedHeader = inlineAssetsToHeader(frontendDir);
  const headerPath = join(tempDir, "embedded_html.h");
  writeFileSync(headerPath, embeddedHeader, "utf8");

  // 3. Compile Windows Icon Resource (.rc -> .res.o) via windres if icon exists
  let resourceObjectParam = "";
  if (process.platform === "win32") {
    let iconPath = winConfig.icon ? resolve(cwd, winConfig.icon) : join(cwd, "src", "assets", "icon.ico");
    if (existsSync(iconPath)) {
      try {
        console.log(`🖼️  Embedding native application icon: ${iconPath}`);
        const rcPath = join(tempDir, "app.rc");
        const resPath = join(tempDir, "app_res.o");
        writeFileSync(rcPath, `1 ICON "${iconPath.replace(/\\/g, "/")}"\n`, "utf8");
        execSync(`windres "${rcPath}" -O coff -o "${resPath}"`, { stdio: "inherit" });
        resourceObjectParam = `"${resPath}"`;
      } catch (err) {
        console.warn("⚠️ [PicoTS] Failed to compile icon with windres:", err);
      }
    }
  }

  // 4. Generate native host source with all OS bindings
  const winHint = winConfig.resizable === false ? "WEBVIEW_HINT_FIXED" : "WEBVIEW_HINT_NONE";
  const title = (winConfig.title || appName).replace(/"/g, '\\"');
  const width = winConfig.width || 1180;
  const height = winConfig.height || 780;

  const nativeSource = `
#include "webview.h"
#include "${headerPath.replace(/\\/g, "/")}"
#include <windows.h>
#include <commdlg.h>
#include <shellapi.h>
#include <shlobj.h>
#include <string>
#include <sstream>
#include <vector>
#include <filesystem>

namespace fs = std::filesystem;

std::string EscapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\\\\"";
        else if (c == '\\\\') o << "\\\\\\\\";
        else if (c == '\\b') o << "\\\\b";
        else if (c == '\\f') o << "\\\\f";
        else if (c == '\\n') o << "\\\\n";
        else if (c == '\\r') o << "\\\\r";
        else if (c == '\\t') o << "\\\\t";
        else if ('\\x00' <= c && c <= '\\x1f') {
            o << "\\\\u" << std::hex << (int)c;
        } else {
            o << c;
        }
    }
    return o.str();
}

std::string ExtractFirstArg(const std::string& req) {
    std::string s = req;
    if (s.length() >= 4 && s.front() == '[' && s.back() == ']') {
        size_t q1 = s.find("\\"");
        if (q1 != std::string::npos) {
            size_t q2 = s.find("\\"", q1 + 1);
            if (q2 != std::string::npos) {
                return s.substr(q1 + 1, q2 - q1 - 1);
            }
        }
    }
    return s;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int) {
    webview::webview w(false, nullptr);
    w.set_title("${title}");
    w.set_size(${width}, ${height}, ${winHint});

    HWND hwnd = (HWND)w.window().value();

    // 1. System Info
    w.bind("get_system_info", [](const std::string&) -> std::string {
        char currentDir[MAX_PATH];
        GetCurrentDirectoryA(MAX_PATH, currentDir);
        std::ostringstream ss;
        ss << "{"
           << "\\"name\\":\\"${appName}\\","
           << "\\"os\\":\\"win32\\","
           << "\\"arch\\":\\"x64\\","
           << "\\"cwd\\":\\"" << EscapeJson(currentDir) << "\\","
           << "\\"pid\\":" << GetCurrentProcessId() << ","
           << "\\"isScriptcNative\\":true,"
           << "\\"features\\":["
           << "\\"Direct Win32 COM Memory IPC (Zero HTTP, 0 Open Ports)\\","
           << "\\"Pure Single-Executable Architecture (< 500 KB)\\","
           << "\\"Native Win32 Open File Picker Dialogs (GetOpenFileNameW)\\","
           << "\\"Native OS Clipboard (Read/Write/Clear)\\","
           << "\\"Native Shell Integration (openExternal, showInFolder)\\","
           << "\\"Windows Action Center Toast Notifications\\","
           << "\\"Hardware-Accelerated Embedded WebView2\\""
           << "]}";
        return ss.str();
    });

    // 2. Open File Dialog
    w.bind("open_file_dialog", [hwnd](const std::string&) -> std::string {
        OPENFILENAMEW ofn = {0};
        wchar_t szFile[MAX_PATH] = {0};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = hwnd;
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = sizeof(szFile) / sizeof(wchar_t);
        ofn.lpstrFilter = L"All Files (*.*)\\0*.*\\0Source Files (*.ts;*.js;*.cpp;*.h)\\0*.ts;*.js;*.cpp;*.h\\0Text Files (*.txt)\\0*.txt\\0";
        ofn.nFilterIndex = 1;
        ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;

        if (GetOpenFileNameW(&ofn) == TRUE) {
            char utf8Path[MAX_PATH * 4] = {0};
            WideCharToMultiByte(CP_UTF8, 0, ofn.lpstrFile, -1, utf8Path, sizeof(utf8Path), NULL, NULL);
            std::ostringstream ss;
            ss << "{\\"path\\":\\"" << EscapeJson(utf8Path) << "\\"}";
            return ss.str();
        }
        return "{\\"path\\":\\"\\"}";
    });

    // 3. Message Box Dialog
    w.bind("show_message_dialog", [hwnd](const std::string&) -> std::string {
        MessageBoxW(hwnd, L"Hello from ${appName}!", L"${title}", MB_OK | MB_ICONINFORMATION);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 4. File System Listing
    w.bind("list_files", [](const std::string& req) -> std::string {
        char cwd[MAX_PATH];
        GetCurrentDirectoryA(MAX_PATH, cwd);
        std::string targetDir = cwd;
        std::string extracted = ExtractFirstArg(req);
        if (!extracted.empty()) targetDir = extracted;

        std::ostringstream ss;
        ss << "{\\"dir\\":\\"" << EscapeJson(targetDir) << "\\",\\"items\\":[";
        try {
            bool first = true;
            for (const auto& entry : fs::directory_iterator(targetDir)) {
                if (!first) ss << ",";
                first = false;
                std::string name = entry.path().filename().string();
                bool isDir = entry.is_directory();
                uintmax_t size = 0;
                try { if (!isDir) size = entry.file_size(); } catch (...) {}
                ss << "{\\"name\\":\\"" << EscapeJson(name) << "\\",\\"isDirectory\\":" << (isDir ? "true" : "false") << ",\\"size\\":" << size << "}";
            }
        } catch (...) {}
        ss << "]}";
        return ss.str();
    });

    // 5. Clipboard Write
    w.bind("clipboard_write", [hwnd](const std::string& req) -> std::string {
        std::string text = ExtractFirstArg(req);
        if (OpenClipboard(hwnd)) {
            EmptyClipboard();
            int wlen = MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, NULL, 0);
            if (wlen > 0) {
                HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, wlen * sizeof(wchar_t));
                if (hMem) {
                    wchar_t* pMem = (wchar_t*)GlobalLock(hMem);
                    MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, pMem, wlen);
                    GlobalUnlock(hMem);
                    SetClipboardData(CF_UNICODETEXT, hMem);
                }
            }
            CloseClipboard();
            return "{\\"status\\":\\"ok\\"}";
        }
        return "{\\"status\\":\\"error\\"}";
    });

    // 6. Clipboard Read
    w.bind("clipboard_read", [hwnd](const std::string&) -> std::string {
        std::string result = "";
        if (OpenClipboard(hwnd)) {
            HANDLE hData = GetClipboardData(CF_UNICODETEXT);
            if (hData) {
                wchar_t* pText = (wchar_t*)GlobalLock(hData);
                if (pText) {
                    char utf8[4096] = {0};
                    WideCharToMultiByte(CP_UTF8, 0, pText, -1, utf8, sizeof(utf8) - 1, NULL, NULL);
                    result = utf8;
                    GlobalUnlock(hData);
                }
            }
            CloseClipboard();
        }
        return "{\\"text\\":\\"" + EscapeJson(result) + "\\"}";
    });

    // 7. Shell Open External (Default Browser)
    w.bind("shell_open_external", [hwnd](const std::string& req) -> std::string {
        std::string url = ExtractFirstArg(req);
        ShellExecuteA(hwnd, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 8. Shell Show Item in Folder (Explorer)
    w.bind("shell_show_in_folder", [](const std::string& req) -> std::string {
        std::string path = ExtractFirstArg(req);
        std::string cmd = "/select,\\"" + path + "\\"";
        ShellExecuteA(NULL, "open", "explorer.exe", cmd.c_str(), NULL, SW_SHOWNORMAL);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 9. Windows Toast Notification
    w.bind("notification_send", [hwnd](const std::string& req) -> std::string {
        std::string title = "${appName}";
        std::string body = "Hello from PicoTS!";
        std::string extracted = ExtractFirstArg(req);
        if (!extracted.empty()) body = extracted;

        NOTIFYICONDATAW nid = {0};
        nid.cbSize = sizeof(NOTIFYICONDATAW);
        nid.hWnd = hwnd;
        nid.uID = 1001;
        nid.uFlags = NIF_INFO | NIF_ICON;
        nid.hIcon = LoadIcon(NULL, IDI_INFORMATION);
        nid.dwInfoFlags = NIIF_INFO;

        MultiByteToWideChar(CP_UTF8, 0, title.c_str(), -1, nid.szInfoTitle, sizeof(nid.szInfoTitle)/sizeof(wchar_t));
        MultiByteToWideChar(CP_UTF8, 0, body.c_str(), -1, nid.szInfo, sizeof(nid.szInfo)/sizeof(wchar_t));

        Shell_NotifyIconW(NIM_ADD, &nid);
        Shell_NotifyIconW(NIM_MODIFY, &nid);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 10. Window Controls
    w.bind("window_minimize", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, SW_MINIMIZE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_maximize", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, IsZoomed(hwnd) ? SW_RESTORE : SW_MAXIMIZE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_close", [hwnd](const std::string&) -> std::string {
        PostMessage(hwnd, WM_CLOSE, 0, 0);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 11. Benchmark
    w.bind("benchmark", [](const std::string&) -> std::string {
        return "{\\"status\\":\\"ok\\"}";
    });

    ${devUrl ? `w.navigate("${devUrl}");` : `w.set_html(reinterpret_cast<const char*>(g_embedded_html));`}
    w.run();
    return 0;
}
`;

  const hostSrcPath = join(tempDir, "host.cc");
  writeFileSync(hostSrcPath, nativeSource, "utf8");

  // 5. Compile with g++
  console.log("🔨 Compiling single standalone binary...");
  const finalExe = join(outDir, `${appName}.exe`);

  const includeDir = webviewPaths.includeDir;
  const staticLib = webviewPaths.windowsStaticLib;

  const compileCmd = `g++ -std=c++17 -O2 -mwindows -I"${includeDir}" "${hostSrcPath}" ${resourceObjectParam} "${staticLib}" -lole32 -lshlwapi -lshell32 -lversion -ladvapi32 -luser32 -lcomdlg32 -o "${finalExe}"`;
  execSync(compileCmd, { stdio: "inherit" });

  console.log(`\n🎉 [PicoTS] Build complete: ${finalExe}\n`);
  return finalExe;
}
