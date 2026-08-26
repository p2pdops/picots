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
  const devUrl = options.devUrl;

  const appName = config.name || "picots-app";
  const winConfig = config.window || {};
  const buildConfig = config.build || {};

  const outDir = resolve(cwd, buildConfig.outDir || "dist");
  let frontendDir = resolve(cwd, buildConfig.frontendDir || "src/frontend");
  const tempDir = resolve(cwd, ".picots");

  // Check Vite build outputs if frontendDir is not found
  if (!existsSync(frontendDir)) {
    if (existsSync(join(tempDir, "frontend"))) {
      frontendDir = join(tempDir, "frontend");
    } else if (existsSync(resolve(cwd, "dist-frontend"))) {
      frontendDir = resolve(cwd, "dist-frontend");
    } else if (existsSync(resolve(cwd, "build"))) {
      frontendDir = resolve(cwd, "build");
    }
  }

  console.log(`\n🚀 [PicoTS] Building ${appName}...`);
  console.log(`   📐 Window: ${winConfig.width}x${winConfig.height} ("${winConfig.title}")`);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  // 1. Terminate previous instances to avoid Windows file locks
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

  // 4. Generate native host source with System Tray, Window Subclassing, and all OS APIs
  const isFrameless = winConfig.frameless === true || winConfig.frame === false;
  const winHint = winConfig.resizable === false ? "WEBVIEW_HINT_FIXED" : "WEBVIEW_HINT_NONE";
  const title = (winConfig.title || appName).replace(/"/g, '\\"');
  const width = winConfig.width || 1180;
  const height = winConfig.height || 780;

  const nativeSource = `
#include "webview.h"
#include "${headerPath.replace(/\\/g, "/")}"
#include <windows.h>
#include <dwmapi.h>
#include <commdlg.h>
#include <shellapi.h>
#include <shlobj.h>
#include <string>
#include <sstream>
#include <vector>
#include <map>
#include <cctype>
#include <filesystem>

namespace fs = std::filesystem;

#define WM_TRAYICON (WM_USER + 100)
#define IDM_TRAY_RESTORE 1001
#define IDM_TRAY_TOAST   1002
#define IDM_TRAY_QUIT    1003

static NOTIFYICONDATAW g_tray_nid = {0};
static bool g_tray_created = false;
static WNDPROC g_original_wndproc = nullptr;
static std::map<int, std::string> g_hotkey_map;
static int g_hotkey_counter = 100;
static webview::webview* g_pWebview = nullptr;

UINT ParseModifiers(const std::string& accel) {
    UINT mod = 0;
    if (accel.find("Ctrl") != std::string::npos || accel.find("Control") != std::string::npos || accel.find("Command") != std::string::npos) mod |= MOD_CONTROL;
    if (accel.find("Shift") != std::string::npos) mod |= MOD_SHIFT;
    if (accel.find("Alt") != std::string::npos) mod |= MOD_ALT;
    if (accel.find("Super") != std::string::npos || accel.find("Meta") != std::string::npos) mod |= MOD_WIN;
    return mod;
}

UINT ParseVK(const std::string& accel) {
    size_t plus = accel.rfind('+');
    std::string key = (plus != std::string::npos) ? accel.substr(plus + 1) : accel;
    if (key.length() == 1) {
        char c = (char)toupper(key[0]);
        if (c >= 'A' && c <= 'Z') return c;
        if (c >= '0' && c <= '9') return c;
    }
    if (key == "F1") return VK_F1;
    if (key == "F2") return VK_F2;
    if (key == "F3") return VK_F3;
    if (key == "F4") return VK_F4;
    if (key == "F5") return VK_F5;
    if (key == "F6") return VK_F6;
    if (key == "F7") return VK_F7;
    if (key == "F8") return VK_F8;
    if (key == "F9") return VK_F9;
    if (key == "F10") return VK_F10;
    if (key == "F11") return VK_F11;
    if (key == "F12") return VK_F12;
    if (key == "Space") return VK_SPACE;
    if (key == "Enter" || key == "Return") return VK_RETURN;
    if (key == "Escape" || key == "Esc") return VK_ESCAPE;
    return 0;
}

std::string EscapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\\\\\"";
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
        size_t q1 = s.find("\\\"");
        if (q1 != std::string::npos) {
            size_t q2 = s.find("\\\"", q1 + 1);
            if (q2 != std::string::npos) {
                return s.substr(q1 + 1, q2 - q1 - 1);
            }
        }
    }
    return s;
}

LRESULT CALLBACK TraySubclassProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_NCCALCSIZE && wParam == TRUE) {
        // Removing standard non-client frame to eliminate the top white line on Windows 10/11
        return 0;
    }
    if (uMsg == WM_HOTKEY) {
        int id = (int)wParam;
        auto it = g_hotkey_map.find(id);
        if (it != g_hotkey_map.end() && g_pWebview) {
            std::string js = "window.__picots_hotkey_trigger && window.__picots_hotkey_trigger(\\\"" + EscapeJson(it->second) + "\\\");";
            g_pWebview->eval(js);
        }
        return 0;
    }
    if (uMsg == WM_TRAYICON) {
        if (lParam == WM_RBUTTONUP) {
            POINT pt;
            GetCursorPos(&pt);
            HMENU hMenu = CreatePopupMenu();
            AppendMenuW(hMenu, MF_STRING, IDM_TRAY_RESTORE, L"Open ${title}");
            AppendMenuW(hMenu, MF_STRING, IDM_TRAY_TOAST, L"Send Toast Notification");
            AppendMenuW(hMenu, MF_SEPARATOR, 0, NULL);
            AppendMenuW(hMenu, MF_STRING, IDM_TRAY_QUIT, L"Quit");

            SetForegroundWindow(hwnd);
            int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_NONOTIFY | TPM_RIGHTBUTTON, pt.x, pt.y, 0, hwnd, NULL);
            DestroyMenu(hMenu);

            if (cmd == IDM_TRAY_RESTORE) {
                ShowWindow(hwnd, SW_RESTORE);
                SetForegroundWindow(hwnd);
            } else if (cmd == IDM_TRAY_TOAST) {
                NOTIFYICONDATAW nid = {0};
                nid.cbSize = sizeof(NOTIFYICONDATAW);
                nid.hWnd = hwnd;
                nid.uID = 1001;
                nid.uFlags = NIF_INFO | NIF_ICON;
                nid.hIcon = LoadIcon(NULL, IDI_INFORMATION);
                nid.dwInfoFlags = NIIF_INFO;
                wcscpy(nid.szInfoTitle, L"${title}");
                wcscpy(nid.szInfo, L"Triggered from System Tray Menu!");
                Shell_NotifyIconW(NIM_MODIFY, &nid);
            } else if (cmd == IDM_TRAY_QUIT) {
                if (g_tray_created) Shell_NotifyIconW(NIM_DELETE, &g_tray_nid);
                PostMessage(hwnd, WM_CLOSE, 0, 0);
            }
            return 0;
        } else if (lParam == WM_LBUTTONDBLCLK || lParam == WM_LBUTTONUP) {
            ShowWindow(hwnd, SW_RESTORE);
            SetForegroundWindow(hwnd);
            return 0;
        }
    }
    return CallWindowProc(g_original_wndproc, hwnd, uMsg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int) {
    // 0. Single-Instance Mutex Lock
    HANDLE hMutex = CreateMutexW(NULL, TRUE, L"Local\\\\PicoTS_App_${appName}");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        HWND hExisting = FindWindowW(NULL, L"${title}");
        if (hExisting) {
            ShowWindow(hExisting, SW_RESTORE);
            SetForegroundWindow(hExisting);
        }
        if (hMutex) CloseHandle(hMutex);
        return 0;
    }

    webview::webview w(true, nullptr);
    g_pWebview = &w;
    w.set_title("${title}");
    w.set_size(${width}, ${height}, ${winHint});

    HWND hwnd = (HWND)w.window().value();

    // Subclass window procedure first so WM_NCCALCSIZE and DWM events are captured immediately
    g_original_wndproc = (WNDPROC)SetWindowLongPtr(hwnd, GWLP_WNDPROC, (LONG_PTR)TraySubclassProc);

    ${isFrameless ? `
    // Frameless window: strip standard caption, minimize/maximize system boxes
    {
        LONG style = GetWindowLong(hwnd, GWL_STYLE);
        style &= ~(WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
        ${winConfig.resizable !== false ? `style |= WS_THICKFRAME;` : `style &= ~WS_THICKFRAME;`}
        SetWindowLong(hwnd, GWL_STYLE, style);

        BOOL darkMode = TRUE;
        DwmSetWindowAttribute(hwnd, 20 /* DWMWA_USE_IMMERSIVE_DARK_MODE */, &darkMode, sizeof(darkMode));
        DwmSetWindowAttribute(hwnd, 19 /* DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20H1 */, &darkMode, sizeof(darkMode));
        MARGINS margins = { 0, 0, 0, 0 };
        DwmExtendFrameIntoClientArea(hwnd, &margins);

        // Force immediate recalculation with TraySubclassProc active
        SetWindowPos(hwnd, NULL, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
        RedrawWindow(hwnd, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW | RDW_FRAME);
    }
    ` : ''}

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
           << "\\"Native Win32 System Tray & Context Menus\\","
           << "\\"Native Win32 Open File Picker Dialogs (GetOpenFileNameW)\\","
           << "\\"Native OS Clipboard (Read/Write/Clear)\\","
           << "\\"Native Shell Integration (openExternal, showInFolder)\\","
           << "\\"Windows Action Center Toast Notifications\\","
           << "\\"Hardware-Accelerated Embedded WebView2\\""
           << "]}";
        return ss.str();
    });

    // 2. System Tray Controls
    w.bind("tray_create", [hwnd](const std::string& req) -> std::string {
        std::string tooltip = ExtractFirstArg(req);
        if (tooltip.empty()) tooltip = "${title}";

        g_tray_nid.cbSize = sizeof(NOTIFYICONDATAW);
        g_tray_nid.hWnd = hwnd;
        g_tray_nid.uID = 2001;
        g_tray_nid.uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP;
        g_tray_nid.uCallbackMessage = WM_TRAYICON;
        g_tray_nid.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(1));
        if (!g_tray_nid.hIcon) g_tray_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);

        MultiByteToWideChar(CP_UTF8, 0, tooltip.c_str(), -1, g_tray_nid.szTip, sizeof(g_tray_nid.szTip)/sizeof(wchar_t));

        if (Shell_NotifyIconW(NIM_ADD, &g_tray_nid)) {
            g_tray_created = true;
            return "{\\"status\\":\\"ok\\"}";
        }
        return "{\\"status\\":\\"error\\"}";
    });

    w.bind("tray_destroy", [](const std::string&) -> std::string {
        if (g_tray_created) {
            Shell_NotifyIconW(NIM_DELETE, &g_tray_nid);
            g_tray_created = false;
        }
        return "{\\"status\\":\\"ok\\"}";
    });

    // 3. Window Hide & Show (Minimize to Tray)
    w.bind("window_hide", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, SW_HIDE);
        return "{\\"status\\":\\"ok\\"}";
    });

    w.bind("window_show", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, SW_RESTORE);
        SetForegroundWindow(hwnd);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 4. Open File Dialog
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

    // 5. Message Box Dialog
    w.bind("show_message_dialog", [hwnd](const std::string&) -> std::string {
        MessageBoxW(hwnd, L"Hello from ${appName}!", L"${title}", MB_OK | MB_ICONINFORMATION);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 6. File System Listing
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

    // 7. Clipboard Write
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

    // 8. Clipboard Read
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

    // 9. Shell Open External
    w.bind("shell_open_external", [hwnd](const std::string& req) -> std::string {
        std::string url = ExtractFirstArg(req);
        ShellExecuteA(hwnd, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 10. Shell Show Item in Folder
    w.bind("shell_show_in_folder", [](const std::string& req) -> std::string {
        std::string path = ExtractFirstArg(req);
        std::string cmd = "/select,\\"" + path + "\\"";
        ShellExecuteA(NULL, "open", "explorer.exe", cmd.c_str(), NULL, SW_SHOWNORMAL);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 11. Toast Notification
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

    // 12. Window Controls & Win32 Bounds
    w.bind("window_minimize", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, SW_MINIMIZE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_maximize", [hwnd](const std::string&) -> std::string {
        ShowWindow(hwnd, IsZoomed(hwnd) ? SW_RESTORE : SW_MAXIMIZE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_close", [hwnd](const std::string&) -> std::string {
        if (g_tray_created) Shell_NotifyIconW(NIM_DELETE, &g_tray_nid);
        PostMessage(hwnd, WM_CLOSE, 0, 0);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_set_size", [hwnd](const std::string& req) -> std::string {
        int w = 1024, h = 768;
        size_t comma = req.find(',');
        if (comma != std::string::npos) {
            size_t s1 = req.find_first_of("0123456789-");
            if (s1 != std::string::npos && s1 < comma) w = std::atoi(req.substr(s1, comma - s1).c_str());
            size_t s2 = req.find_first_of("0123456789-", comma + 1);
            if (s2 != std::string::npos) h = std::atoi(req.substr(s2).c_str());
        }
        SetWindowPos(hwnd, NULL, 0, 0, w, h, SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_set_position", [hwnd](const std::string& req) -> std::string {
        int x = 100, y = 100;
        size_t comma = req.find(',');
        if (comma != std::string::npos) {
            size_t s1 = req.find_first_of("0123456789-");
            if (s1 != std::string::npos && s1 < comma) x = std::atoi(req.substr(s1, comma - s1).c_str());
            size_t s2 = req.find_first_of("0123456789-", comma + 1);
            if (s2 != std::string::npos) y = std::atoi(req.substr(s2).c_str());
        }
        SetWindowPos(hwnd, NULL, x, y, 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_center", [hwnd](const std::string&) -> std::string {
        RECT rc;
        GetWindowRect(hwnd, &rc);
        int w = rc.right - rc.left;
        int h = rc.bottom - rc.top;
        int screenW = GetSystemMetrics(SM_CXSCREEN);
        int screenH = GetSystemMetrics(SM_CYSCREEN);
        int x = (screenW - w) / 2;
        int y = (screenH - h) / 2;
        SetWindowPos(hwnd, NULL, x, y, 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_set_always_on_top", [hwnd](const std::string& req) -> std::string {
        bool top = req.find("true") != std::string::npos || req.find("1") != std::string::npos;
        SetWindowPos(hwnd, top ? HWND_TOPMOST : HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_set_opacity", [hwnd](const std::string& req) -> std::string {
        double alpha = 1.0;
        size_t s = req.find_first_of("0123456789.");
        if (s != std::string::npos) alpha = std::atof(req.substr(s).c_str());
        if (alpha < 0.0) alpha = 0.0;
        if (alpha > 1.0) alpha = 1.0;
        LONG ex = GetWindowLong(hwnd, GWL_EXSTYLE);
        SetWindowLong(hwnd, GWL_EXSTYLE, ex | WS_EX_LAYERED);
        SetLayeredWindowAttributes(hwnd, 0, (BYTE)(alpha * 255), LWA_ALPHA);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_flash_frame", [hwnd](const std::string& req) -> std::string {
        bool flag = req.find("true") != std::string::npos || req.find("1") != std::string::npos;
        FlashWindow(hwnd, flag ? TRUE : FALSE);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_start_drag", [hwnd](const std::string&) -> std::string {
        ReleaseCapture();
        SendMessage(hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
        return "{\\"status\\":\\"ok\\"}";
    });
    w.bind("window_set_frame", [hwnd](const std::string& req) -> std::string {
        bool frame = req.find("true") != std::string::npos || req.find("1") != std::string::npos;
        LONG style = GetWindowLong(hwnd, GWL_STYLE);
        if (frame) {
            style |= (WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU | WS_THICKFRAME);
        } else {
            style &= ~(WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
        }
        SetWindowLong(hwnd, GWL_STYLE, style);
        SetWindowPos(hwnd, NULL, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
        return "{\\"status\\":\\"ok\\"}";
    });

    // 13. Global Hotkey Accelerators
    w.bind("global_shortcut_register", [hwnd](const std::string& req) -> std::string {
        std::string accel = ExtractFirstArg(req);
        if (accel.empty()) return "{\\"status\\":\\"error\\"}";
        UINT mod = ParseModifiers(accel);
        UINT vk = ParseVK(accel);
        if (vk == 0) return "{\\"status\\":\\"error\\"}";
        int id = ++g_hotkey_counter;
        if (RegisterHotKey(hwnd, id, mod, vk)) {
            g_hotkey_map[id] = accel;
            return "{\\"status\\":\\"ok\\"}";
        }
        return "{\\"status\\":\\"error\\"}";
    });
    w.bind("global_shortcut_unregister", [hwnd](const std::string& req) -> std::string {
        std::string accel = ExtractFirstArg(req);
        for (auto it = g_hotkey_map.begin(); it != g_hotkey_map.end(); ++it) {
            if (it->second == accel) {
                UnregisterHotKey(hwnd, it->first);
                g_hotkey_map.erase(it);
                break;
            }
        }
        return "{\\"status\\":\\"ok\\"}";
    });

    // 14. Benchmark
    w.bind("benchmark", [](const std::string&) -> std::string {
        return "{\\"status\\":\\"ok\\"}";
    });

    ${devUrl ? `w.navigate("${devUrl}");` : `w.set_html(reinterpret_cast<const char*>(g_embedded_html));`}
    w.run();

    if (g_tray_created) Shell_NotifyIconW(NIM_DELETE, &g_tray_nid);
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

  const compileCmd = `g++ -std=c++17 -O2 -mwindows -I"${includeDir}" "${hostSrcPath}" ${resourceObjectParam} "${staticLib}" -lole32 -lshlwapi -lshell32 -lversion -ladvapi32 -luser32 -lcomdlg32 -ldwmapi -o "${finalExe}"`;
  execSync(compileCmd, { stdio: "inherit" });

  console.log(`\n🎉 [PicoTS] Build complete: ${finalExe}\n`);
  return finalExe;
}
