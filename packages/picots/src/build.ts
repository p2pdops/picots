import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inlineAssetsToHeader } from "./inliner.js";
import { webviewPaths } from "@picots/webview";

export interface BuildOptions {
  cwd?: string;
  outDir?: string;
  name?: string;
}

export async function buildProject(options: BuildOptions = {}): Promise<string> {
  const cwd = options.cwd || process.cwd();
  const outDir = options.outDir || join(cwd, "dist");
  const appName = options.name || "picots-app";
  const frontendDir = join(cwd, "src", "frontend");
  const tempDir = join(cwd, ".picots");

  console.log(`\n🚀 [PicoTS] Building ${appName}...`);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  // 1. Terminate any previous instance
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

  // 3. Generate native host source
  const nativeSource = `
#include "webview.h"
#include "${headerPath.replace(/\\/g, "/")}"
#include <windows.h>
#include <commdlg.h>
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

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int) {
    webview::webview w(false, nullptr);
    w.set_title("${appName}");
    w.set_size(1180, 780, WEBVIEW_HINT_NONE);

    HWND hwnd = (HWND)w.window().value();

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
           << "\\"Custom Frameless Titlebar with Window Management\\","
           << "\\"Hardware-Accelerated Embedded WebView2\\""
           << "]}";
        return ss.str();
    });

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

    w.bind("show_message_dialog", [hwnd](const std::string&) -> std::string {
        MessageBoxW(hwnd, L"Hello from ${appName}!", L"${appName}", MB_OK | MB_ICONINFORMATION);
        return "{\\"status\\":\\"ok\\"}";
    });

    w.bind("list_files", [](const std::string& req) -> std::string {
        char cwd[MAX_PATH];
        GetCurrentDirectoryA(MAX_PATH, cwd);
        std::string targetDir = cwd;

        if (req.length() > 4 && req != "[\\"\\"]" && req != "[]") {
            size_t firstQuote = req.find("\\"");
            if (firstQuote != std::string::npos) {
                size_t secondQuote = req.find("\\"", firstQuote + 1);
                if (secondQuote != std::string::npos) {
                    std::string extracted = req.substr(firstQuote + 1, secondQuote - firstQuote - 1);
                    if (!extracted.empty()) targetDir = extracted;
                }
            }
        }

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

    w.bind("benchmark", [](const std::string&) -> std::string {
        return "{\\"status\\":\\"ok\\"}";
    });

    w.set_html(reinterpret_cast<const char*>(g_embedded_html));
    w.run();
    return 0;
}
`;

  const hostSrcPath = join(tempDir, "host.cc");
  writeFileSync(hostSrcPath, nativeSource, "utf8");

  // 4. Compile with g++
  console.log("🔨 Compiling single standalone binary...");
  const finalExe = join(outDir, `${appName}.exe`);

  const includeDir = webviewPaths.includeDir;
  const staticLib = webviewPaths.windowsStaticLib;

  const compileCmd = `g++ -std=c++17 -O2 -mwindows -I"${includeDir}" "${hostSrcPath}" "${staticLib}" -lole32 -lshlwapi -lversion -ladvapi32 -luser32 -lcomdlg32 -o "${finalExe}"`;
  execSync(compileCmd, { stdio: "inherit" });

  console.log(`\n🎉 [PicoTS] Build complete: ${finalExe}\n`);
  return finalExe;
}
