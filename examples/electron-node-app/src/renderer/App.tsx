import React, { useState, useEffect } from "react";
import {
  Terminal,
  Cpu,
  HardDrive,
  ShieldCheck,
  DownloadCloud,
  Zap,
  Layers,
  Database,
  Bell,
  Copy,
  FolderOpen,
  MessageSquare,
  Minus as MinimizeIcon,
  Square as MaximizeIcon,
  X as CloseIcon,
  CheckCircle2,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Info,
} from "lucide-react";
import type { RecordItem, ActivityLog } from "../main/db";

export default function App() {
  const [activeTab, setActiveTab] = useState<"node" | "electron" | "ipc" | "storage" | "info">("node");
  const [nodeInfo, setNodeInfo] = useState<any>(null);
  const [cryptoInput, setCryptoInput] = useState<string>("PicoTS Electron & Node Verification");
  const [cryptoAlgo, setCryptoAlgo] = useState<string>("sha256");
  const [cryptoResult, setCryptoResult] = useState<any>(null);
  const [fsBenchResult, setFsBenchResult] = useState<any>(null);
  const [fsBenchLoading, setFsBenchLoading] = useState<boolean>(false);
  const [benchRunning, setBenchRunning] = useState<boolean>(false);
  const [benchStats, setBenchStats] = useState<any>(null);
  const [storeItems, setStoreItems] = useState<RecordItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("System");
  const [clipboardText, setClipboardText] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchNodeInfo();
    fetchStoreItems();
    handleComputeCrypto();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchNodeInfo = async () => {
    if (typeof window !== "undefined" && window.electronAPI?.getNodeSystemInfo) {
      try {
        const info = await window.electronAPI.getNodeSystemInfo();
        setNodeInfo(info);
      } catch (err: any) {
        console.error("Failed to query node info:", err);
      }
    }
  };

  const fetchStoreItems = async () => {
    if (typeof window !== "undefined" && window.electronAPI?.getItems) {
      try {
        const items = await window.electronAPI.getItems();
        setStoreItems(items);
      } catch (err: any) {
        console.error("Failed to fetch store items:", err);
      }
    }
  };

  const handleComputeCrypto = async () => {
    if (!window.electronAPI?.computeCryptoHash) return;
    try {
      const res = await window.electronAPI.computeCryptoHash(cryptoInput, cryptoAlgo);
      setCryptoResult(res);
    } catch (err: any) {
      showToast(`Crypto error: ${err.message}`);
    }
  };

  const handleRunFsBenchmark = async (count: number = 100) => {
    if (!window.electronAPI?.runFsBenchmark) return;
    setFsBenchLoading(true);
    try {
      const res = await window.electronAPI.runFsBenchmark(count);
      setFsBenchResult(res);
      showToast(`FS benchmark: ${res.records} records read/written in ${(parseFloat(res.writeDurationMs) + parseFloat(res.readDurationMs)).toFixed(2)}ms`);
    } catch (err: any) {
      showToast(`FS error: ${err.message}`);
    } finally {
      setFsBenchLoading(false);
    }
  };

  const handleRunIpcBenchmark = async (iterations: number = 500) => {
    if (!window.electronAPI?.getNodeSystemInfo) return;
    setBenchRunning(true);
    const latencies: number[] = [];
    const t0 = performance.now();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await window.electronAPI.getNodeSystemInfo();
      latencies.push(performance.now() - start);
    }

    const totalTime = performance.now() - t0;
    const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
    const min = Math.min(...latencies).toFixed(3);
    const max = Math.max(...latencies).toFixed(3);
    const ops = ((iterations / totalTime) * 1000).toFixed(0);

    setBenchStats({ iterations, avg, min, max, ops, totalTimeMs: totalTime.toFixed(2) });
    setBenchRunning(false);
  };

  const handleShowOpenDialog = async () => {
    try {
      const res = await window.electronAPI.showOpenDialog();
      showToast(res.canceled ? "File dialog canceled" : `Selected: ${res.filePaths?.join(", ")}`);
    } catch (err: any) {
      showToast(`Dialog error: ${err.message}`);
    }
  };

  const handleShowMessageBox = async () => {
    try {
      await window.electronAPI.showMessageBox(
        "Electron Native Dialog",
        "This native dialog is invoked through standard Electron dialog.showMessageBox() API in PicoTS."
      );
    } catch (err: any) {
      showToast(`Message box error: ${err.message}`);
    }
  };

  const handleSendNotification = async () => {
    try {
      await window.electronAPI.sendNotification(
        "PicoTS Electron Parity ✅",
        "Native desktop push notification fired via standard new Notification() API."
      );
      showToast("Notification dispatched!");
    } catch (err: any) {
      showToast(`Notification error: ${err.message}`);
    }
  };

  const handleClipboardTest = async () => {
    const textToCopy = `PicoTS-Test-Token-${Date.now()}`;
    await window.electronAPI.writeClipboard(textToCopy);
    const readBack = await window.electronAPI.readClipboard();
    setClipboardText(readBack);
    showToast(`Clipboard verified: ${readBack}`);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle) return;
    try {
      await window.electronAPI.addItem({
        title: newItemTitle,
        category: newItemCategory,
        value: parseFloat((Math.random() * 500).toFixed(2)),
        tags: ["live", "test"],
      });
      setNewItemTitle("");
      fetchStoreItems();
      showToast("Record added to store!");
    } catch (err: any) {
      showToast(`Add item error: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await window.electronAPI.deleteItem(id);
      fetchStoreItems();
      showToast("Record removed!");
    } catch (err: any) {
      showToast(`Delete item error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none">
      {/* 🪟 Custom Draggable Titlebar */}
      <header className="flex items-center justify-between h-10 px-3 bg-slate-900 border-b border-slate-800 drag-region">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white font-bold">
            P
          </span>
          <span className="font-bold tracking-tight">Pico<span className="text-indigo-400">TS</span></span>
          <span className="text-[10px] text-slate-500 font-mono">Electron &amp; Node.js Verification Suite</span>
        </div>

        <div className="flex items-center no-drag">
          <button
            onClick={() => window.electronAPI?.minimize()}
            title="Minimize"
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MinimizeIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.electronAPI?.maximize()}
            title="Maximize"
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MaximizeIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.electronAPI?.close()}
            title="Close"
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => setActiveTab("node")}
            title="Node.js Core APIs (node:os, node:crypto, node:fs, node:path)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "node" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Terminal className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("electron")}
            title="Electron Native APIs (Dialog, Notification, Clipboard)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "electron" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("ipc")}
            title="IPC & Latency Benchmark"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "ipc" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Zap className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            title="Data Store & CRUD Engine"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "storage" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Database className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("info")}
            title="Architecture & Specs"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "info" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </nav>

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: NODE.JS CORE APIS */}
          {activeTab === "node" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" /> Node.js Built-in Modules in PicoTS AOT
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Validating native compilation of <code>node:os</code>, <code>node:crypto</code>, <code>node:path</code>, and <code>node:fs</code> via ScriptC QuickJS-NG.
                  </p>
                </div>
                <button
                  onClick={fetchNodeInfo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Specs
                </button>
              </div>

              {/* System Specs Cards */}
              {nodeInfo && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                      <Cpu className="w-4 h-4" /> node:os Host &amp; CPU
                    </div>
                    <div className="text-base font-bold text-white">{nodeInfo.platform} ({nodeInfo.arch})</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">{nodeInfo.hostname} • {nodeInfo.cpus} Cores</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                      <HardDrive className="w-4 h-4" /> node:os Memory
                    </div>
                    <div className="text-base font-bold text-white">{nodeInfo.freeMemory} / {nodeInfo.totalMemory}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">Homedir: {nodeInfo.homedir}</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                      <ShieldCheck className="w-4 h-4" /> node:crypto (UUID v4)
                    </div>
                    <div className="text-xs font-mono text-emerald-400 truncate mt-1">{nodeInfo.sampleUuid}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Native RNG &amp; Crypto Subsystem</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                      <DownloadCloud className="w-4 h-4" /> node:path Resolution
                    </div>
                    <div className="text-xs font-mono text-slate-300 truncate mt-1">{nodeInfo.joinedPath}</div>
                    <div className="text-[11px] text-slate-500 mt-1">IPC Latency: {nodeInfo.latencyMs} ms</div>
                  </div>
                </div>
              )}

              {/* Interactive Crypto Generator */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> Interactive node:crypto Hasher
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={cryptoInput}
                    onChange={(e) => setCryptoInput(e.target.value)}
                    placeholder="Enter string to hash..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <select
                    value={cryptoAlgo}
                    onChange={(e) => setCryptoAlgo(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="sha256">SHA-256</option>
                    <option value="sha512">SHA-512</option>
                    <option value="sha1">SHA-1</option>
                    <option value="md5">MD5</option>
                  </select>
                  <button
                    onClick={handleComputeCrypto}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                  >
                    Compute Hash
                  </button>
                </div>

                {cryptoResult && (
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-1 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Algorithm: {cryptoResult.algorithm.toUpperCase()}</span>
                      <span className="text-emerald-400">{cryptoResult.durationMs} ms</span>
                    </div>
                    <div className="text-indigo-300 break-all">{cryptoResult.hash}</div>
                  </div>
                )}
              </div>

              {/* Disk I/O Benchmark using node:fs */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-indigo-400" /> Disk I/O Stress Test (node:fs writeFileSync + readFileSync)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Generates structured records, serializes to JSON, writes to temp disk, reads back and verifies checksums.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={fsBenchLoading}
                      onClick={() => handleRunFsBenchmark(100)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                    >
                      100 Records
                    </button>
                    <button
                      disabled={fsBenchLoading}
                      onClick={() => handleRunFsBenchmark(500)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30"
                    >
                      {fsBenchLoading ? "Benchmarking..." : "500 Records"}
                    </button>
                  </div>
                </div>

                {fsBenchResult && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-500">Bytes Processed</span>
                      <div className="text-white font-bold mt-0.5">{(fsBenchResult.bytesWritten / 1024).toFixed(1)} KB</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Write Time (Sync)</span>
                      <div className="text-emerald-400 font-bold mt-0.5">{fsBenchResult.writeDurationMs} ms</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Read + Parse Time</span>
                      <div className="text-indigo-400 font-bold mt-0.5">{fsBenchResult.readDurationMs} ms</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ELECTRON NATIVE APIS */}
          {activeTab === "electron" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Electron Desktop &amp; OS Integration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Testing native window dialogs, system notifications, and system clipboard APIs.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Native Dialogs */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" /> Native File &amp; Message Dialogs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Triggers native Win32/macOS file open dialogs and message box prompts via <code>dialog.showOpenDialog</code> and <code>dialog.showMessageBox</code>.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleShowOpenDialog}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Show Open Dialog
                    </button>
                    <button
                      onClick={handleShowMessageBox}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Show Message Box
                    </button>
                  </div>
                </div>

                {/* Notifications & Clipboard */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" /> Notifications &amp; Clipboard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fires native desktop push notifications and interacts directly with OS clipboard memory.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSendNotification}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" /> Send Notification
                    </button>
                    <button
                      onClick={handleClipboardTest}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Test Clipboard Read/Write
                    </button>
                  </div>
                  {clipboardText && (
                    <div className="text-[11px] font-mono text-emerald-400 pt-1">
                      Clipboard contents: {clipboardText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IPC BENCHMARK */}
          {activeTab === "ipc" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400" /> High-Throughput IPC Latency Benchmark
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Measures continuous roundtrip latency between Webview UI context and Main process handlers.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={benchRunning}
                    onClick={() => handleRunIpcBenchmark(200)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    200 Invocations
                  </button>
                  <button
                    disabled={benchRunning}
                    onClick={() => handleRunIpcBenchmark(1000)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {benchRunning ? "Running..." : "1,000 Invocations"}
                  </button>
                </div>
              </div>

              {benchStats && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Average Latency</span>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">{benchStats.avg} ms</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Sub-millisecond dispatch</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Min Latency</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{benchStats.min} ms</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Lowest single call</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Max Latency</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{benchStats.max} ms</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Peak jitter</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Throughput</span>
                    <h3 className="text-2xl font-bold text-indigo-400 mt-1">{benchStats.ops} ops/s</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Total {benchStats.totalTimeMs} ms</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATA STORE */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" /> Embedded Data Store &amp; CRUD Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Verifies CRUD mutations through <code>ipcMain.handle</code> and state synchronization.
                  </p>
                </div>
              </div>

              {/* Add item form */}
              <form onSubmit={handleAddItem} className="flex gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <input
                  required
                  type="text"
                  placeholder="Record Title (e.g. Server Configuration)..."
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-40 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Record
                </button>
              </form>

              {/* Records Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {storeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-500">{item.id}</td>
                        <td className="p-3 font-medium text-white">{item.title}</td>
                        <td className="p-3 text-indigo-400">{item.category}</td>
                        <td className="p-3 text-slate-300 font-mono">{item.value.toFixed(2)}</td>
                        <td className="p-3 text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ARCHITECTURE SPECS */}
          {activeTab === "info" && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> PicoTS Architecture &amp; Parity Matrix
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                PicoTS bridges the full Electron ecosystem into high-performance, single-binary desktop executables compiled via ScriptC &amp; QuickJS-NG.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-indigo-400 font-bold">Standard Electron APIs</span>
                  <p className="text-slate-400 mt-1"><code>ipcMain</code>, <code>ipcRenderer</code>, <code>contextBridge</code>, <code>BrowserWindow</code>, <code>Notification</code>, <code>dialog</code>, <code>clipboard</code>, <code>shell</code>.</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-indigo-400 font-bold">Node.js Built-in Core Modules</span>
                  <p className="text-slate-400 mt-1"><code>node:os</code>, <code>node:crypto</code>, <code>node:fs</code>, <code>node:path</code>, <code>node:events</code>, <code>node:buffer</code>.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}
    </div>
  );
}
