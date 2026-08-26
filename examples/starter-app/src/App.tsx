import React, { useState, useEffect } from "react";
import { app, Window, dialog, fs, clipboard, shell, notification, tray, SystemInfo, ListFilesResult } from "@picots/core";

const win = new Window();

type TabType = "dashboard" | "native-os" | "files" | "benchmark" | "architecture";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [latency, setLatency] = useState<string>("--");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [clipInput, setClipInput] = useState<string>("Hello from PicoTS React!");
  const [clipResult, setClipResult] = useState<string>("");
  const [notificationStatus, setNotificationStatus] = useState<string>("");
  const [trayStatus, setTrayStatus] = useState<string>("");
  
  // File Explorer State
  const [fileData, setFileData] = useState<ListFilesResult | null>(null);
  const [currentDir, setCurrentDir] = useState<string>("");

  // Benchmark State
  const [benchRunning, setBenchRunning] = useState<boolean>(false);
  const [benchStats, setBenchStats] = useState<{ avg: string; min: string; max: string; rps: string } | null>(null);
  const [benchLogs, setBenchLogs] = useState<Array<{ id: number; diff: string }>>([]);

  useEffect(() => {
    app.getSystemInfo().then((info) => {
      setSysInfo(info);
      if (info?.cwd) {
        setCurrentDir(info.cwd);
        loadFiles(info.cwd);
      }
    });
    measureLatency();
  }, []);

  const measureLatency = async () => {
    const t0 = performance.now();
    await app.benchmark();
    setLatency((performance.now() - t0).toFixed(3) + " ms");
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
    const res = await dialog.openFile({ title: "Select a File" });
    if (!res.canceled) {
      setSelectedFilePath(res.path);
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
        <aside className="w-56 bg-[#0a0f1d]/80 border-r border-white/5 p-3 flex flex-col justify-between">
          <nav className="space-y-1">
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
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">IPC Transport</div>
            <div className="text-cyan-400 font-bold">Zero-HTTP Direct COM</div>
            <div className="text-slate-400 mt-1">Latency: <span className="text-emerald-400">{latency}</span></div>
          </div>
        </aside>

        {/* Tab Content Panes */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                      ⚡ React 19 + Tailwind + Vite HMR
                    </span>
                    <h1 className="text-2xl font-bold mt-2 text-white">PicoTS React Desktop</h1>
                    <p className="text-slate-400 text-sm mt-1">
                      100% TypeScript. Zero Node.js runtime bloat. Sub-megabyte standalone executable.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">COM Latency</div>
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

          {/* TAB 2: NATIVE OS APIS */}
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
                    onClick={() => dialog.showMessage("PicoTS React", "Hello from Native Windows Message Box!")}
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

          {/* TAB 3: FILE EXPLORER */}
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

          {/* TAB 4: DIRECT COM BENCHMARK */}
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
