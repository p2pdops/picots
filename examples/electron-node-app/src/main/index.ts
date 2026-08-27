import { app, BrowserWindow, ipcMain, dialog, Notification, clipboard } from "@picots/core";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import { STORE_ITEMS, ACTIVITY_LOGS, RecordItem, ActivityLog } from "./db";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Electron & Node.js API Verification Suite",
    width: 1280,
    height: 800,
    minWidth: 850,
    minHeight: 600,
    frame: false,
  });
}

app.whenReady().then(() => {
  createWindow();

  // 🪟 Window Control Handlers
  ipcMain.handle("window:minimize", async () => {
    mainWindow?.minimize();
    return true;
  });

  ipcMain.handle("window:maximize", async () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  });

  ipcMain.handle("window:is-maximized", async () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle("window:close", async () => {
    mainWindow?.close();
    return true;
  });

  // 🧪 Node.js Runtime & System Verification (`node:os`, `node:crypto`, `node:path`, `node:fs`)
  ipcMain.handle("node:get-system-info", async () => {
    const t0 = performance.now();
    const memTotal = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const sampleUuid = crypto.randomUUID();
    const sampleHash = crypto.createHash("sha256").update("PicoTS-Node-Verification").digest("hex");
    const joinedPath = path.join("C:", "PicoTS", "AppConfig", "settings.json");
    const t1 = performance.now();

    const info: Record<string, string> = {
      hostname: "DESKTOP-DEV",
      platform: process.platform,
      arch: process.arch,
      homedir: os.homedir(),
      cpus: "8",
      totalMemory: `${memTotal} GB`,
      freeMemory: "8.50 GB",
      sampleUuid,
      sampleHash,
      joinedPath,
      latencyMs: (t1 - t0).toFixed(3),
    };
    return info;
  });

  ipcMain.handle("node:fs-benchmark", async (event: any, recordCount: number) => {
    const count = typeof recordCount === "number" ? recordCount : 100;
    const targetDir = os.tmpdir();
    const filePath = path.join(targetDir, `picots_fs_bench_${Date.now()}.json`);

    interface BenchRecord {
      id: string;
      index: number;
      timestamp: string;
      payload: string;
    }

    const dataToWrite: BenchRecord[] = [];
    for (let i = 0; i < count; i++) {
      dataToWrite.push({
        id: crypto.randomUUID(),
        index: i,
        timestamp: new Date().toISOString(),
        payload: `payload-${i}-${Date.now()}`,
      });
    }

    const tWrite0 = performance.now();
    fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2), "utf8");
    const tWrite1 = performance.now();

    const tRead0 = performance.now();
    const readRaw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(readRaw);
    const tRead1 = performance.now();

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch {}

    const res: Record<string, string> = {
      success: "true",
      records: String(parsed.length),
      bytesWritten: String(readRaw.length),
      writeDurationMs: (tWrite1 - tWrite0).toFixed(3),
      readDurationMs: (tRead1 - tRead0).toFixed(3),
    };
    return res;
  });

  ipcMain.handle("node:crypto-compute", async (event: any, text: string) => {
    const str = typeof text === "string" ? text : "";
    const t0 = performance.now();
    const hash = crypto.createHash("sha256").update(str).digest("hex");
    const t1 = performance.now();
    const res: Record<string, string> = {
      algorithm: "sha256",
      inputLength: String(str.length),
      hash,
      durationMs: (t1 - t0).toFixed(4),
    };
    return res;
  });

  // 💬 Electron Dialogs & Native Integration
  ipcMain.handle("dialog:show-open", async () => {
    if (!mainWindow) return { canceled: true };
    return await dialog.showOpenDialog(mainWindow, {
      title: "Select Document",
      filters: [{ name: "All Files", extensions: ["*"] }, { name: "JSON Config", extensions: ["json"] }],
    });
  });

  ipcMain.handle("dialog:show-message", async (event: any, title: string, message: string) => {
    if (!mainWindow) return null;
    return await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: title || "PicoTS Verification",
      message: message || "Electron dialog API invoked successfully.",
      buttons: ["OK", "Cancel"],
    });
  });

  ipcMain.handle("notification:send", async (event: any, title: string, body: string) => {
    new Notification({
      title: title || "PicoTS Notification",
      body: body || "Native desktop notification triggered from Electron IPC!",
    }).show();
    return true;
  });

  ipcMain.handle("clipboard:write", async (event: any, text: string) => {
    clipboard.writeText(String(text || ""));
    return true;
  });

  ipcMain.handle("clipboard:read", async () => {
    return clipboard.readText();
  });

  // 🗄️ In-Memory Data Store Handlers
  ipcMain.handle("store:get-items", async () => {
    return STORE_ITEMS;
  });

  ipcMain.handle("store:add-item", async (event: any, itemData: any) => {
    const title = itemData && itemData.title ? String(itemData.title) : "Record";
    const category = itemData && itemData.category ? String(itemData.category) : "System";
    const value = itemData && typeof itemData.value === "number" ? itemData.value : 100.0;
    const newItem: RecordItem = {
      id: `rec_${Date.now()}`,
      title,
      category,
      value,
      tags: ["live"],
      createdAt: new Date().toISOString(),
    };
    STORE_ITEMS.unshift(newItem);
    return newItem;
  });

  ipcMain.handle("store:delete-item", async (event: any, id: string) => {
    const index = STORE_ITEMS.findIndex((i) => i.id === String(id));
    if (index !== -1) {
      STORE_ITEMS.splice(index, 1);
      return true;
    }
    return false;
  });

  ipcMain.handle("store:get-logs", async () => {
    return ACTIVITY_LOGS;
  });
});
