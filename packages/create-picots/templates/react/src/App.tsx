import React, { useState, useEffect } from "react";
import { app, Window, dialog, fs, clipboard, shell, notification, SystemInfo } from "@picots/core";

const win = new Window();

export default function App() {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [clipInput, setClipInput] = useState<string>("Hello from PicoTS React!");
  const [clipResult, setClipResult] = useState<string>("");
  const [latency, setLatency] = useState<string>("--");
  const [notificationStatus, setNotificationStatus] = useState<string>("");

  useEffect(() => {
    app.getSystemInfo().then(setSysInfo);
    measureLatency();
  }, []);

  const measureLatency = async () => {
    const t0 = performance.now();
    await app.benchmark();
    setLatency((performance.now() - t0).toFixed(3) + " ms");
  };

  const handleOpenFile = async () => {
    const res = await dialog.openFile({ title: "Select a File" });
    if (!res.canceled) {
      setSelectedPath(res.path);
    }
  };

  const handleCopy = async () => {
    await clipboard.writeText(clipInput);
    setClipResult(`Copied "${clipInput}" to clipboard!`);
  };

  const handlePaste = async () => {
    const text = await clipboard.readText();
    setClipResult(text ? `Pasted: "${text}"` : "Clipboard is empty");
  };

  const handleSendToast = async () => {
    await notification.send({
      title: "PicoTS React App",
      body: "Instant Native Toast Notification triggered from React state!",
    });
    setNotificationStatus("Toast notification dispatched!");
  };

  const handleOpenGitHub = async () => {
    await shell.openExternal("https://github.com/p2pdops/picots");
  };

  return (
    <div className="flex flex-col h-screen bg-[#080c14] text-slate-100 font-sans select-none">
      {/* Custom Draggable Titlebar */}
      <header className="flex items-center justify-between h-11 px-4 bg-[#0d121f]/90 border-b border-white/5 drag-region backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-purple-500 text-black text-xs font-bold">
            P
          </span>
          <span>PicoTS + React + Tailwind</span>
        </div>

        <div className="flex items-center no-drag">
          <button
            onClick={() => win.minimize()}
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            —
          </button>
          <button
            onClick={() => win.maximize()}
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ▢
          </button>
          <button
            onClick={() => win.close()}
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 transition-colors"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                ⚡ React 19 + Vite HMR Active
              </span>
              <h1 className="text-2xl font-bold mt-2 text-white">Next-Gen Desktop Application</h1>
              <p className="text-slate-400 text-sm mt-1">
                Zero Node.js runtime bloat. Direct in-memory COM IPC. Standalone sub-megabyte binary.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">IPC Roundtrip</div>
              <div className="text-xl font-bold font-mono text-cyan-400">{latency}</div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Native Dialogs */}
          <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 hover:border-cyan-500/30 transition-all">
            <h3 className="text-base font-bold text-slate-200 mb-2">Native OS Dialogs</h3>
            <p className="text-xs text-slate-400 mb-4">
              Trigger genuine Win32 Open File and MessageBox dialogs without HTTP.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleOpenFile}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
              >
                Open File Dialog
              </button>
              <button
                onClick={() => dialog.showMessage("PicoTS React", "Hello from Native Windows Message Box!")}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Trigger Alert
              </button>
            </div>
            {selectedPath && (
              <div className="mt-3 p-2 text-xs font-mono bg-black/40 rounded border border-white/5 text-slate-300 break-all">
                Selected: {selectedPath}
              </div>
            )}
          </div>

          {/* OS Clipboard */}
          <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 hover:border-cyan-500/30 transition-all">
            <h3 className="text-base font-bold text-slate-200 mb-2">Native Clipboard</h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct Win32 clipboard read/write without web permissions.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={clipInput}
                onChange={(e) => setClipInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400"
              >
                Copy
              </button>
              <button
                onClick={handlePaste}
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

          {/* Toast & Shell */}
          <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 hover:border-cyan-500/30 transition-all">
            <h3 className="text-base font-bold text-slate-200 mb-2">Shell & Notifications</h3>
            <p className="text-xs text-slate-400 mb-4">
              Dispatches native Windows Action Center notifications and opens external links.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSendToast}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors"
              >
                🔔 Send Toast Notification
              </button>
              <button
                onClick={handleOpenGitHub}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                🌐 Open GitHub
              </button>
            </div>
            {notificationStatus && (
              <div className="mt-3 text-xs text-purple-300 font-mono">
                {notificationStatus}
              </div>
            )}
          </div>

          {/* System Metrics */}
          <div className="p-5 rounded-xl bg-[#0f1523]/70 border border-white/5 hover:border-cyan-500/30 transition-all">
            <h3 className="text-base font-bold text-slate-200 mb-2">System Metrics</h3>
            <p className="text-xs text-slate-400 mb-3">Host operating system details via ScriptC AOT.</p>
            <div className="space-y-1.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Platform:</span>
                <span>{sysInfo?.os} ({sysInfo?.arch})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Process ID:</span>
                <span className="text-cyan-400 font-bold">{sysInfo?.pid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Working Directory:</span>
                <span className="truncate max-w-[200px]">{sysInfo?.cwd}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
