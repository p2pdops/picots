import React, { useState, useEffect } from "react";
import { 
  app, 
  BrowserWindow, 
  dialog, 
  fs, 
  clipboard, 
  shell, 
  notification, 
  tray, 
  ipcRenderer,
  SystemInfo, 
  ListFilesResult 
} from "@picots/core";

// Reference to current window
const win = new BrowserWindow();

type TabType = "dashboard" | "electron-bridge" | "ipc-main" | "native-os" | "files" | "benchmark";

interface UserProfile {
  id: string;
  name: string;
  role: string;
  stack: string;
  openPorts: number;
  binarySize: string;
  memoryUsageMb: number;
}

interface BridgeLogEntry {
  id: string;
  time: string;
  channel: string;
  duration: string;
  status: "success" | "error";
  response?: any;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("electron-bridge");
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [latency, setLatency] = useState<string>("--");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [clipInput, setClipInput] = useState<string>("Hello from PicoTS React!");
  const [clipResult, setClipResult] = useState<string>("");
  const [notificationStatus, setNotificationStatus] = useState<string>("");
  const [trayStatus, setTrayStatus] = useState<string>("");
  
  // IPC Main state (Demonstrating ipcRenderer.invoke -> ipcMain.handle)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hashInput, setHashInput] = useState<string>("PicoTS Fast Native IPC");
  const [hashResult, setHashResult] = useState<{ input: string; hash: string } | null>(null);

  // Electron Preload Bridge State (window.electronAPI)
  const [bridgeStatus, setBridgeStatus] = useState<string>("Checking...");
  const [bridgeMethods, setBridgeMethods] = useState<string[]>([]);
  const [bridgeAppState, setBridgeAppState] = useState<any>(null);
  const [bridgeItems, setBridgeItems] = useState<any[]>([]);
  const [bridgeSearch, setBridgeSearch] = useState<string>("");
  const [bridgeInvoice, setBridgeInvoice] = useState<any>(null);
  const [bridgeSalesHistory, setBridgeSalesHistory] = useState<any[]>([]);
  const [bridgePushEvent, setBridgePushEvent] = useState<any>(null);
  const [bridgeLogs, setBridgeLogs] = useState<BridgeLogEntry[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  // File Explorer State
  const [fileData, setFileData] = useState<ListFilesResult | null>(null);
  const [currentDir, setCurrentDir] = useState<string>("");

  // Benchmark State
  const [benchRunning, setBenchRunning] = useState<boolean>(false);
  const [benchStats, setBenchStats] = useState<{ avg: string; min: string; max: string; rps: string } | null>(null);
  const [benchLogs, setBenchLogs] = useState<Array<{ id: number; diff: string }>>([]);

  useEffect(() => {
    // Check window.electronAPI availability
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      const keys = Object.keys((window as any).electronAPI);
      setBridgeMethods(keys);
      setBridgeStatus(`Active (${keys.length} exposed methods)`);
    } else {
      setBridgeStatus("Not Found");
    }

    // Subscribe to push events via window.electronAPI
    if (typeof window !== "undefined" && (window as any).electronAPI?.["events:on-notification"]) {
      const unsubscribe = (window as any).electronAPI["events:on-notification"]((data: any) => {
        setBridgePushEvent(data);
        logBridgeCall("events:notification-received", "0.10", "success", data);
      });
      return () => unsubscribe && unsubscribe();
    }
  }, []);

  useEffect(() => {
    app.getSystemInfo().then((info) => {
      setSysInfo(info);
      if (info?.cwd) {
        setCurrentDir(info.cwd);
        loadFiles(info.cwd);
      }
    });
    fetchUserProfile();
    measureLatency();
  }, []);

  const logBridgeCall = (channel: string, duration: string, status: "success" | "error", response?: any) => {
    const entry: BridgeLogEntry = {
      id: Math.random().toString(36).substring(2, 8),
      time: new Date().toLocaleTimeString(),
      channel,
      duration,
      status,
      response,
    };
    setBridgeLogs((prev) => [entry, ...prev.slice(0, 19)]);
    setSelectedResponse({ channel, duration, status, response, time: entry.time });
  };

  const handleBridgeCall = async (channel: string, fn: () => Promise<any>) => {
    const t0 = performance.now();
    try {
      const res = await fn();
      const duration = (performance.now() - t0).toFixed(2);
      logBridgeCall(channel, duration, "success", res);
      return res;
    } catch (err: any) {
      const duration = (performance.now() - t0).toFixed(2);
      logBridgeCall(channel, duration, "error", { error: err?.message || String(err) });
      throw err;
    }
  };

  const testGetAppState = async () => {
    const state = await handleBridgeCall("app:get-state", () => (window as any).electronAPI["app:get-state"]());
    setBridgeAppState(state);
  };

  const testSaveSettings = async () => {
    const res = await handleBridgeCall("app:save-settings", () =>
      (window as any).electronAPI["app:save-settings"]({
        lastTested: new Date().toISOString(),
        theme: "dark-neon",
        posMode: "FAST_SUPERMARKET",
      })
    );
    if (res?.settings) setBridgeAppState((prev: any) => ({ ...prev, settings: res.settings }));
  };

  const testSearchItems = async (q: string) => {
    setBridgeSearch(q);
    const items = await handleBridgeCall("items:search", () => (window as any).electronAPI["items:search"](q));
    setBridgeItems(items || []);
  };

  const testGetAllItems = async () => {
    const items = await handleBridgeCall("items:get-all", () => (window as any).electronAPI["items:get-all"]());
    setBridgeItems(items || []);
  };

  const testSaveInvoice = async () => {
    const mockInvoice = {
      invoiceNumber: "INV-" + Math.floor(1000 + Math.random() * 9000),
      customerName: "Rahul Sharma (Gold Tier)",
      items: [
        { id: "itm_101", name: "Whole Wheat Bread 400g", price: 45, quantity: 2 },
        { id: "itm_104", name: "Filter Coffee Blend 250g", price: 180, quantity: 1 },
      ],
      totalAmount: 270,
      paymentMode: "UPI" as const,
    };
    const res = await handleBridgeCall("pos:save-invoice", () => (window as any).electronAPI["pos:save-invoice"](mockInvoice));
    setBridgeInvoice(res);
  };

  const testGetSalesHistory = async () => {
    const history = await handleBridgeCall("sales:get-history", () => (window as any).electronAPI["sales:get-history"]({ limit: 5 }));
    setBridgeSalesHistory(history || []);
  };

  const testTriggerPushEvent = async () => {
    handleBridgeCall("events:trigger-mock", async () => {
      (window as any).electronAPI["events:trigger-mock-event"](
        "Order Staged #9021",
        "Cart transferred to Billing Counter 02"
      );
      return { triggered: true };
    });
  };

  const measureLatency = async () => {
    const t0 = performance.now();
    await app.benchmark();
    setLatency((performance.now() - t0).toFixed(3) + " ms");
  };

  const fetchUserProfile = async () => {
    try {
      // Calls ipcMain.handle("get-user-profile") in src/main/index.ts!
      const profile = await ipcRenderer.invoke("get-user-profile", "usr_picots_01");
      setUserProfile(profile);
    } catch (err) {
      console.error("fetchUserProfile error:", err);
    }
  };

  const handleComputeHash = async () => {
    try {
      // Calls ipcMain.handle("compute-hash") in src/main/index.ts!
      const res = await ipcRenderer.invoke("compute-hash", hashInput);
      setHashResult(res);
    } catch (err) {
      console.error("computeHash error:", err);
    }
  };

  const loadFiles = async (dir: string) => {
    try {
      const data = await fs.listFiles(dir);
      setFileData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFile = async () => {
    const res = await dialog.showOpenDialog(win, { title: "Select a File" });
    if (!res.canceled && res.filePaths.length > 0) {
      setSelectedFilePath(res.filePaths[0]);
    }
  };

  const handleCopyClipboard = async () => {
    await clipboard.writeText(clipInput);
    setClipResult(`Copied "${clipInput}" to Windows Clipboard!`);
  };

  const handlePasteClipboard = async () => {
    const text = await clipboard.readText();
    setClipResult(text ? `Pasted: "${text}"` : "Clipboard is empty");
  };

  const handleSendToast = async () => {
    await notification.send({
      title: "PicoTS React Desktop",
      body: "Native Windows Toast Notification triggered from React state!",
    });
    setNotificationStatus("Toast notification dispatched to Action Center!");
  };

  const handleCreateTray = async () => {
    await tray.create({ tooltip: "PicoTS React Desktop" });
    setTrayStatus("Icon added to Windows Notification Area (System Tray)!");
  };

  const handleHideToTray = async () => {
    await tray.create({ tooltip: "PicoTS React Desktop" });
    await win.hide();
  };

  const runBenchmark = async (count: number = 200) => {
    setBenchRunning(true);
    setBenchLogs([]);
    const latencies: number[] = [];
    const tStartOverall = performance.now();

    for (let i = 1; i <= count; i++) {
      const t0 = performance.now();
      await app.benchmark();
      const diff = performance.now() - t0;
      latencies.push(diff);

      if (i % 20 === 0 || i === count) {
        setBenchLogs((prev) => [
          ...prev.slice(-10),
          { id: i, diff: diff.toFixed(3) + " ms" },
        ]);
      }
    }

    const totalTime = performance.now() - tStartOverall;
    const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
    const min = Math.min(...latencies).toFixed(3);
    const max = Math.max(...latencies).toFixed(3);
    const rps = (count / (totalTime / 1000)).toFixed(0);

    setBenchStats({ avg: `${avg} ms`, min: `${min} ms`, max: `${max} ms`, rps: `${rps} ops/s` });
    setBenchRunning(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#080c14] text-slate-100 font-sans select-none">
      {/* Custom Draggable Titlebar */}
      <header className="flex items-center justify-between h-11 px-4 bg-[#0d121f]/95 border-b border-white/5 drag-region backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-purple-500 text-black text-xs font-black shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            P
          </span>
          <span className="font-bold tracking-tight">Pico<span className="text-cyan-400">TS</span></span>
          <span className="text-xs text-slate-500 font-mono">React Desktop</span>
        </div>

        <div className="flex items-center no-drag">
          <button
            onClick={() => win.minimize()}
            title="Minimize"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            —
          </button>
          <button
            onClick={() => win.maximize()}
            title="Maximize / Restore"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ▢
          </button>
          <button
            onClick={() => win.close()}
            title="Close"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 transition-colors"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 bg-[#0a0f1d]/80 border-r border-white/5 p-3 flex flex-col justify-between">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("electron-bridge")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "electron-bridge"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>🌉</span>
              <span>Electron Preload Bridge</span>
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>📊</span>
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("ipc-main")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "ipc-main"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>🔄</span>
              <span>ipcMain &amp; ipcRenderer</span>
            </button>

            <button
              onClick={() => setActiveTab("native-os")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "native-os"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>🪟</span>
              <span>Native OS APIs</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "files"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>📁</span>
              <span>File Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab("benchmark")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "benchmark"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>⚡</span>
              <span>Direct COM Bench</span>
            </button>
          </nav>

          {/* Sidebar Footer Metrics */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px] font-mono">
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Preload Bridge Status</div>
            <div className="text-cyan-400 font-bold truncate">window.electronAPI</div>
            <div className="text-slate-400 mt-1">Status: <span className="text-emerald-400">{bridgeStatus}</span></div>
          </div>
        </aside>

        {/* Tab Content Panes */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 0: ELECTRON PRELOAD BRIDGE TESTING */}
          {activeTab === "electron-bridge" && (
            <div className="space-y-6 max-w-6xl">
              {/* Header Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                        contextBridge.exposeInMainWorld('electronAPI', ...)
                      </span>
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Drop-in Electron Compatibility
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold mt-2 text-white flex items-center gap-2">
                      <span>🌉 Electron Preload Bridge Suite</span>
                    </h1>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      Testing 100% Electron-compatible renderer isolation via <code className="text-cyan-300">window.electronAPI</code> with live IPC logging.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">Bridge Object</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {typeof window !== "undefined" && (window as any).electronAPI ? "✅ Detected" : "❌ Not Found"}
                    </div>
                  </div>
                </div>

                {/* Exposed Methods Badges */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Exposed Methods on window.electronAPI:</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {bridgeMethods.map((m) => (
                      <span key={m} className="px-2 py-0.5 text-[11px] font-mono rounded bg-black/40 text-cyan-300 border border-white/5">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Testing Grid */}
              <div className="grid grid-cols-2 gap-5">
                {/* 1. App & System State Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>⚙️</span>
                      <span>App &amp; Settings</span>
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">app:*</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={testGetAppState}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                    >
                      Fetch State (app:get-state)
                    </button>
                    <button
                      onClick={testSaveSettings}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                    >
                      Save Settings (app:save-settings)
                    </button>
                  </div>

                  {bridgeAppState && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono space-y-1 text-slate-300">
                      <div><span className="text-slate-500">App:</span> {bridgeAppState.appName} (v{bridgeAppState.version})</div>
                      <div><span className="text-slate-500">Env:</span> {bridgeAppState.environment} | <span className="text-emerald-400">Online</span></div>
                      <div><span className="text-slate-500">Settings:</span> {JSON.stringify(bridgeAppState.settings)}</div>
                    </div>
                  )}
                </div>

                {/* 2. Items & Catalog Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>📦</span>
                      <span>Items &amp; Catalog Search</span>
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">items:*</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search items (e.g. Bread, Milk, Coffee)..."
                      value={bridgeSearch}
                      onChange={(e) => testSearchItems(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={testGetAllItems}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                    >
                      Get All
                    </button>
                  </div>

                  {bridgeItems.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {bridgeItems.map((item) => (
                        <div key={item.id} className="p-2 rounded bg-black/30 border border-white/5 text-xs flex justify-between items-center font-mono">
                          <div>
                            <div className="text-slate-200 font-sans font-medium">{item.name}</div>
                            <div className="text-[10px] text-slate-500">{item.barcode} • {item.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-cyan-400 font-bold">₹{item.price.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">Stock: {item.stock}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Invoicing & Billing Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>💳</span>
                      <span>POS Billing &amp; Sales</span>
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">pos:*, sales:*</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={testSaveInvoice}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                    >
                      Save Mock Invoice (pos:save-invoice)
                    </button>
                    <button
                      onClick={testGetSalesHistory}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                    >
                      Sales History (sales:get-history)
                    </button>
                  </div>

                  {bridgeInvoice && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs font-mono text-emerald-300 space-y-1">
                      <div><span className="text-slate-400">Invoice ID:</span> {bridgeInvoice.invoiceId} (Saved &amp; Logged)</div>
                      <div className="text-[10px] text-slate-400">{bridgeInvoice.receiptUrl}</div>
                    </div>
                  )}

                  {bridgeSalesHistory.length > 0 && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono space-y-1 text-slate-300 max-h-28 overflow-y-auto">
                      <div className="text-slate-500 text-[10px] uppercase">Recent Invoices ({bridgeSalesHistory.length})</div>
                      {bridgeSalesHistory.map((inv, idx) => (
                        <div key={idx} className="flex justify-between border-b border-white/5 pb-1">
                          <span>{inv.id} - {inv.customerName}</span>
                          <span className="text-emerald-400 font-bold">₹{inv.totalAmount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Window Controls & Push Events Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>🪟</span>
                      <span>Window Controls &amp; Events</span>
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">window:*, events:*</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleBridgeCall("window:minimize", () => (window as any).electronAPI["window:minimize"]())}
                      className="px-2 py-1.5 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      Minimize
                    </button>
                    <button
                      onClick={() => handleBridgeCall("window:maximize", () => (window as any).electronAPI["window:maximize"]())}
                      className="px-2 py-1.5 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      Maximize
                    </button>
                    <button
                      onClick={() => handleBridgeCall("window:toggle-fullscreen", () => (window as any).electronAPI["window:toggle-fullscreen"]())}
                      className="px-2 py-1.5 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      Fullscreen
                    </button>
                  </div>

                  <button
                    onClick={testTriggerPushEvent}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔔</span>
                    <span>Trigger Real-time Push Event (events:trigger-mock)</span>
                  </button>

                  {bridgePushEvent && (
                    <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs font-mono text-purple-300 space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>📩 Event Received:</span>
                        <span className="text-white">{bridgePushEvent.title}</span>
                      </div>
                      <div className="text-slate-300">{bridgePushEvent.message}</div>
                      <div className="text-[10px] text-slate-500">Timestamp: {bridgePushEvent.time}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Bridge Invocations Log & Inspector */}
              <div className="grid grid-cols-3 gap-5">
                {/* Real-time Call Stream */}
                <div className="col-span-1 p-4 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bridge Stream Log</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{bridgeLogs.length} calls</span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {bridgeLogs.length === 0 ? (
                      <div className="text-xs text-slate-500 font-mono py-4 text-center">No bridge calls yet. Click any test action above!</div>
                    ) : (
                      bridgeLogs.map((log) => (
                        <div
                          key={log.id}
                          onClick={() => setSelectedResponse(log)}
                          className={`p-2 rounded cursor-pointer border transition-all text-xs font-mono flex items-center justify-between ${
                            selectedResponse?.channel === log.channel && selectedResponse?.time === log.time
                              ? "bg-cyan-500/15 border-cyan-500/40 text-white"
                              : "bg-black/30 border-white/5 text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="truncate">
                            <span className="text-cyan-400 font-bold">{log.channel}</span>
                          </div>
                          <div className="text-right flex items-center gap-1.5 text-[10px]">
                            <span className="text-emerald-400 font-bold">{log.duration}ms</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Response Inspector */}
                <div className="col-span-2 p-4 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Inspector</h4>
                    {selectedResponse && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {selectedResponse.channel} ({selectedResponse.duration}ms)
                      </span>
                    )}
                  </div>
                  <pre className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-cyan-300 max-h-56 overflow-y-auto overflow-x-auto">
                    {selectedResponse
                      ? JSON.stringify(selectedResponse.response, null, 2)
                      : '// Click any test button above to inspect live IPC response'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                      ⚡ React 19 + Electron-Compatible Architecture
                    </span>
                    <h1 className="text-2xl font-bold mt-2 text-white">PicoTS React Desktop</h1>
                    <p className="text-slate-400 text-sm mt-1">
                      Main Process (<code>src/main/index.ts</code>) + Renderer (<code>src/renderer/App.tsx</code>).
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">IPC Roundtrip</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400">{latency}</div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-4 font-mono">
                <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                  <div className="text-xs text-slate-500">Platform</div>
                  <div className="text-base font-bold text-white mt-1">{sysInfo?.os} ({sysInfo?.arch})</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                  <div className="text-xs text-slate-500">Process ID</div>
                  <div className="text-base font-bold text-cyan-400 mt-1">{sysInfo?.pid || "--"}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                  <div className="text-xs text-slate-500">Open Ports</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">0 (Zero HTTP)</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                  <div className="text-xs text-slate-500">Binary Size</div>
                  <div className="text-base font-bold text-purple-400 mt-1">&lt; 500 KB</div>
                </div>
              </div>

              {/* Capabilities List */}
              <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5">
                <h3 className="text-sm font-bold text-slate-200 mb-3">Active Framework Capabilities</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  {sysInfo?.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-cyan-400">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IPC MAIN & IPC RENDERER SHOWCASE */}
          {activeTab === "ipc-main" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">ipcMain &amp; ipcRenderer Bridge</h2>
                <p className="text-xs text-slate-400 mt-1">
                  React calls <code>ipcRenderer.invoke(channel)</code> ➔ Handled by <code>ipcMain.handle(channel)</code> in <code>src/main/index.ts</code> over in-memory COM.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Profile IPC Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">Main Process User Profile</h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      ipcMain.handle
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fetched from backend process via <code>ipcRenderer.invoke("get-user-profile")</code>.
                  </p>
                  
                  {userProfile && (
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="text-white font-bold">{userProfile.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="text-cyan-400">{userProfile.role}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Stack:</span> <span className="text-emerald-400">{userProfile.stack}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">RAM Overhead:</span> <span className="text-purple-400">{userProfile.memoryUsageMb} MB</span></div>
                    </div>
                  )}

                  <button
                    onClick={fetchUserProfile}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
                  >
                    🔄 Re-fetch Profile from Main Process
                  </button>
                </div>

                {/* Compute Hash IPC Card */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">Backend Hash Calculation</h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      ipcRenderer.invoke
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sends string to main process, computes hash in native backend, returns result.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hashInput}
                      onChange={(e) => setHashInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleComputeHash}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-purple-500 text-white hover:bg-purple-400"
                    >
                      Hash in Main
                    </button>
                  </div>

                  {hashResult && (
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1 text-xs font-mono">
                      <div className="text-slate-500">Computed Hash:</div>
                      <div className="text-emerald-400 font-bold text-sm">{hashResult.hash}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NATIVE OS APIS */}
          {activeTab === "native-os" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Native OS Integrations</h2>

              <div className="grid grid-cols-2 gap-5">
                {/* File Picker */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">Native File Open Dialog</h3>
                  <p className="text-xs text-slate-400">Triggers genuine Win32 <code>GetOpenFileNameW</code> dialog directly.</p>
                  <button
                    onClick={handleOpenFile}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
                  >
                    Launch File Picker
                  </button>
                  {selectedFilePath && (
                    <div className="p-2 text-xs font-mono bg-black/40 rounded border border-white/5 text-slate-300 break-all">
                      {selectedFilePath}
                    </div>
                  )}
                </div>

                {/* Message Box */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">Native Message Box</h3>
                  <p className="text-xs text-slate-400">Displays a Win32 <code>MessageBoxW</code> modal alert.</p>
                  <button
                    onClick={() => dialog.showMessageBox(win, { title: "PicoTS React", message: "Hello from Native Windows Message Box!" })}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                  >
                    Trigger Windows Alert
                  </button>
                </div>

                {/* Clipboard */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">Native Clipboard</h3>
                  <p className="text-xs text-slate-400">Direct Win32 clipboard read/write via memory.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clipInput}
                      onChange={(e) => setClipInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleCopyClipboard}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handlePasteClipboard}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white"
                    >
                      Paste
                    </button>
                  </div>
                  {clipResult && (
                    <div className="p-2 text-xs font-mono bg-black/40 rounded border border-white/5 text-cyan-300">
                      {clipResult}
                    </div>
                  )}
                </div>

                {/* System Tray & Toast */}
                <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">System Tray & Toast</h3>
                  <p className="text-xs text-slate-400">Taskbar notification icon & Action Center toasts.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTray}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
                    >
                      📥 Add to Tray
                    </button>
                    <button
                      onClick={handleHideToTray}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white"
                    >
                      👁️ Hide to Tray
                    </button>
                    <button
                      onClick={handleSendToast}
                      className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500 hover:bg-purple-400 text-white"
                    >
                      🔔 Send Toast
                    </button>
                  </div>
                  {(trayStatus || notificationStatus) && (
                    <div className="p-2 text-xs font-mono bg-black/40 rounded border border-white/5 text-purple-300">
                      {trayStatus || notificationStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FILE EXPLORER */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Native File Explorer</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{fileData?.dir}</p>
                </div>
                <button
                  onClick={() => loadFiles(currentDir)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="rounded-xl bg-[#0f1523]/70 border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5 font-mono text-xs">
                  {fileData?.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span>{item.isDirectory ? "📁" : "📄"}</span>
                        <span className={item.isDirectory ? "text-cyan-300 font-semibold" : "text-slate-300"}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {item.isDirectory ? "Directory" : `${(item.size / 1024).toFixed(1)} KB`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIRECT COM BENCHMARK */}
          {activeTab === "benchmark" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Direct COM IPC Benchmark</h2>
                  <p className="text-xs text-slate-400">Measures raw in-memory message dispatch throughput vs loopback HTTP.</p>
                </div>
                <button
                  onClick={() => runBenchmark(300)}
                  disabled={benchRunning}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black transition-all disabled:opacity-50"
                >
                  {benchRunning ? "Running 300 Dispatches..." : "⚡ Run 300 Dispatches"}
                </button>
              </div>

              {benchStats && (
                <div className="grid grid-cols-4 gap-4 font-mono">
                  <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                    <div className="text-xs text-slate-500">Avg Latency</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">{benchStats.avg}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                    <div className="text-xs text-slate-500">Min Latency</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">{benchStats.min}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                    <div className="text-xs text-slate-500">Max Latency</div>
                    <div className="text-lg font-bold text-purple-400 mt-1">{benchStats.max}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0f1523]/70 border border-white/5">
                    <div className="text-xs text-slate-500">Throughput</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">{benchStats.rps}</div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                {benchLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between text-slate-400">
                    <span>COM In-Memory Dispatch #{log.id}</span>
                    <span className="text-cyan-400 font-bold">{log.diff}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
