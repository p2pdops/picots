// ScriptC Desktop - Direct Native COM IPC Client SDK

// Standardized window.api bridge
window.api = {
  async getSystemInfo() {
    if (typeof window.get_system_info === "function") {
      const raw = await window.get_system_info();
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  },

  async openFileDialog() {
    if (typeof window.open_file_dialog === "function") {
      const raw = await window.open_file_dialog();
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  },

  async showMessageBox(title, message) {
    if (typeof window.show_message_dialog === "function") {
      const raw = await window.show_message_dialog(title, message);
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  },

  async listFiles(dir = "") {
    if (typeof window.list_files === "function") {
      const raw = await window.list_files(dir);
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  },

  async minimize() {
    if (typeof window.window_minimize === "function") {
      return await window.window_minimize();
    }
  },

  async maximize() {
    if (typeof window.window_maximize === "function") {
      return await window.window_maximize();
    }
  },

  async close() {
    if (typeof window.window_close === "function") {
      return await window.window_close();
    }
  },

  async benchmark() {
    if (typeof window.benchmark === "function") {
      return await window.benchmark();
    }
  },

  async clipboardWrite(text) {
    if (typeof window.clipboard_write === "function") {
      return await window.clipboard_write(text);
    }
  },

  async clipboardRead() {
    if (typeof window.clipboard_read === "function") {
      const raw = await window.clipboard_read();
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return { text: "" };
  },

  async openExternal(url) {
    if (typeof window.shell_open_external === "function") {
      return await window.shell_open_external(url);
    }
  },

  async notificationSend(title, body) {
    if (typeof window.notification_send === "function") {
      return await window.notification_send(body);
    }
  },
};

// Titlebar Window Controls
document.getElementById("btn-win-min")?.addEventListener("click", () => window.api.minimize());
document.getElementById("btn-win-max")?.addEventListener("click", () => window.api.maximize());
document.getElementById("btn-win-close")?.addEventListener("click", () => window.api.close());

// Navigation & Tab Switching
const navItems = document.querySelectorAll(".nav-item");
const tabPanes = document.querySelectorAll(".tab-pane");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const tabId = item.getAttribute("data-tab");

    navItems.forEach((nav) => nav.classList.remove("active"));
    tabPanes.forEach((pane) => pane.classList.remove("active"));

    item.classList.add("active");
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.add("active");

    if (tabId === "files") {
      loadFiles();
    }
  });
});

// Fetch Backend Status & System Info
async function fetchSystemData() {
  const statusIndicator = document.querySelector(".status-indicator");
  const backendStatusText = document.getElementById("backend-status-text");

  try {
    const sysData = await window.api.getSystemInfo();
    if (!sysData) return;

    statusIndicator.className = "status-indicator online";
    backendStatusText.textContent = "Direct Native COM IPC (0 Open Ports)";

    // Metrics
    document.getElementById("stat-runtime").textContent = "Direct COM";
    document.getElementById("stat-pid").textContent = sysData.pid || "--";
    document.getElementById("stat-platform").textContent = `Platform: ${sysData.os} (${sysData.arch})`;

    // Metadata Table
    document.getElementById("stat-cwd").textContent = sysData.cwd || "--";

    // Capabilities
    const capContainer = document.getElementById("capabilities-container");
    if (capContainer && sysData.features) {
      capContainer.innerHTML = sysData.features
        .map(
          (feat) => `
        <div class="cap-item">
          <span class="cap-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span>${feat}</span>
        </div>
      `
        )
        .join("");
    }
  } catch (err) {
    console.error("fetchSystemData error:", err);
  }
}

// Initial Latency Measurement
async function checkInitialLatency() {
  const t0 = performance.now();
  try {
    await window.api.benchmark();
    const lat = (performance.now() - t0).toFixed(3);
    const latencyEl = document.getElementById("stat-ipc-latency");
    if (latencyEl) latencyEl.textContent = `${lat} ms`;
  } catch {}
}

// Native Dialog Handlers
document.getElementById("btn-open-file-dialog")?.addEventListener("click", async () => {
  const result = await window.api.openFileDialog();
  const pathEl = document.getElementById("file-dialog-path");
  if (pathEl) {
    pathEl.textContent = result?.path || "User canceled selection";
  }
});

document.getElementById("btn-show-msg-dialog")?.addEventListener("click", async () => {
  const statusEl = document.getElementById("msg-dialog-status");
  if (statusEl) statusEl.textContent = "Modal open on Windows...";
  await window.api.showMessageBox("PicoTS", "Hello from Native Windows Message Box!");
  if (statusEl) statusEl.textContent = "Dialog dismissed by user";
});

// Clipboard Handlers
document.getElementById("btn-copy-clipboard")?.addEventListener("click", async () => {
  const input = document.getElementById("clipboard-input");
  const text = input ? input.value : "";
  await window.api.clipboardWrite(text);
  const resEl = document.getElementById("clipboard-result");
  if (resEl) resEl.textContent = `Copied "${text}" to Windows Clipboard!`;
});

document.getElementById("btn-paste-clipboard")?.addEventListener("click", async () => {
  const res = await window.api.clipboardRead();
  const resEl = document.getElementById("clipboard-result");
  if (resEl) resEl.textContent = res?.text ? `Pasted: "${res.text}"` : "Clipboard empty";
});

// Shell & Notification Handlers
document.getElementById("btn-send-toast")?.addEventListener("click", async () => {
  const statusEl = document.getElementById("shell-status");
  if (statusEl) statusEl.textContent = "Sending toast notification...";
  await window.api.notificationSend("PicoTS", "Hello from Native Windows Action Center!");
  if (statusEl) statusEl.textContent = "Toast notification dispatched!";
});

document.getElementById("btn-open-github")?.addEventListener("click", async () => {
  const statusEl = document.getElementById("shell-status");
  if (statusEl) statusEl.textContent = "Opening browser...";
  await window.api.openExternal("https://github.com/p2pdops/picots");
  if (statusEl) statusEl.textContent = "Opened GitHub in default browser!";
});

// Native File Explorer
async function loadFiles(dir = "") {
  const container = document.getElementById("file-list-container");
  const pathDisplay = document.getElementById("current-dir-display");

  try {
    const data = await window.api.listFiles(dir);
    if (!data) return;

    if (pathDisplay) pathDisplay.textContent = data.dir || "Root";

    if (!data.items || data.items.length === 0) {
      container.innerHTML = `<div class="file-row" style="color: var(--text-muted);">No files found in directory</div>`;
      return;
    }

    const sorted = data.items.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
      return a.isDirectory ? -1 : 1;
    });

    container.innerHTML = sorted
      .map((item) => {
        const typeLabel = item.isDirectory ? "Folder" : "File";
        const badgeClass = item.isDirectory ? "dir" : "file";
        const sizeLabel = item.isDirectory ? "--" : formatBytes(item.size);

        return `
          <div class="file-row">
            <div class="file-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: ${item.isDirectory ? "var(--accent-cyan)" : "var(--text-muted)"}">
                ${
                  item.isDirectory
                    ? '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
                    : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
                }
              </svg>
              <span>${item.name}</span>
            </div>
            <div><span class="file-badge ${badgeClass}">${typeLabel}</span></div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${sizeLabel}</div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    container.innerHTML = `<div class="file-row" style="color: var(--accent-red);">Failed to load files: ${err.message}</div>`;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// In-Memory IPC Benchmark Runner
async function runBenchmark() {
  const countSelect = document.getElementById("benchmark-count");
  const count = parseInt(countSelect.value, 10) || 200;

  const btn = document.getElementById("btn-run-benchmark");
  btn.disabled = true;
  btn.style.opacity = "0.7";

  const resultsDiv = document.getElementById("benchmark-results");
  const logsDiv = document.getElementById("benchmark-logs");
  resultsDiv.style.display = "block";
  logsDiv.innerHTML = "";

  const latencies = [];
  const startOverall = performance.now();

  for (let i = 1; i <= count; i++) {
    const tStart = performance.now();
    try {
      await window.api.benchmark();
      const tEnd = performance.now();
      const diff = tEnd - tStart;
      latencies.push(diff);

      if (i % 10 === 0 || i === count) {
        const logRow = document.createElement("div");
        logRow.className = "log-entry";
        logRow.innerHTML = `
          <span>COM Dispatch #${String(i).padStart(4, "0")} → Native Win32 Memory</span>
          <span class="highlight-cyan font-bold">${diff.toFixed(3)} ms</span>
        `;
        logsDiv.appendChild(logRow);
        logsDiv.scrollTop = logsDiv.scrollHeight;
      }
    } catch (err) {
      console.error(err);
    }
  }

  const totalTime = performance.now() - startOverall;
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const min = Math.min(...latencies).toFixed(3);
  const max = Math.max(...latencies).toFixed(3);
  const rps = ((count / (totalTime / 1000))).toFixed(0);

  document.getElementById("bench-avg").textContent = `${avg} ms`;
  document.getElementById("bench-min").textContent = `${min} ms`;
  document.getElementById("bench-max").textContent = `${max} ms`;
  document.getElementById("bench-rps").textContent = `${rps} ops/s`;

  btn.disabled = false;
  btn.style.opacity = "1";
}

// Event Listeners
document.getElementById("btn-refresh-stats")?.addEventListener("click", () => {
  fetchSystemData();
  checkInitialLatency();
});

document.getElementById("btn-refresh-files")?.addEventListener("click", () => {
  loadFiles();
});

document.getElementById("btn-run-benchmark")?.addEventListener("click", runBenchmark);

// Auto-run on start
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    fetchSystemData();
    checkInitialLatency();
  }, 100);
});
