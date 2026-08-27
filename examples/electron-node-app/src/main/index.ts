import { app, BrowserWindow, ipcMain, dialog, Notification, clipboard, shell } from "electron";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import fs from "node:fs";
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
    const memTotal = os.totalmem ? (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) : "16.00";
    const memFree = os.freemem ? (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) : "8.50";
    const cpusCount = os.cpus ? os.cpus().length : 8;
    const sampleUuid = crypto.randomUUID ? crypto.randomUUID() : "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const sampleHash = crypto.createHash("sha256").update("PicoTS-Node-Verification").digest("hex");
    const joinedPath = path.join("C:", "PicoTS", "AppConfig", "settings.json");
    const t1 = performance.now();

    return {
      hostname: os.hostname ? os.hostname() : "DESKTOP-DEV",
      platform: os.platform ? os.platform() : process.platform,
      arch: os.arch ? os.arch() : process.arch,
      homedir: os.homedir ? os.homedir() : (process.env.USERPROFILE || "C:\\Users\\dev"),
      cpus: cpusCount,
      totalMemory: `${memTotal} GB`,
      freeMemory: `${memFree} GB`,
      sampleUuid,
      sampleHash,
      joinedPath,
      latencyMs: (t1 - t0).toFixed(3),
    };
  });

  ipcMain.handle("node:fs-benchmark", async (_event, recordCount: number = 100) => {
    const targetDir = os.tmpdir ? os.tmpdir() : app.getPath("temp");
    const filePath = path.join(targetDir, `picots_fs_bench_${Date.now()}.json`);

    const dataToWrite = Array.from({ length: recordCount }, (_, i) => ({
      id: crypto.randomUUID(),
      index: i,
      timestamp: new Date().toISOString(),
      payload: crypto.randomBytes ? crypto.randomBytes(32).toString("hex") : `payload-${i}-${Date.now()}`,
    }));

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

    return {
      success: true,
      records: parsed.length,
      bytesWritten: readRaw.length,
      writeDurationMs: (tWrite1 - tWrite0).toFixed(3),
      readDurationMs: (tRead1 - tRead0).toFixed(3),
    };
  });

  ipcMain.handle("node:crypto-compute", async (_event, text: string, algorithm: string = "sha256") => {
    const t0 = performance.now();
    const hash = crypto.createHash(algorithm).update(text).digest("hex");
    const t1 = performance.now();
    return {
      algorithm,
      inputLength: text.length,
      hash,
      durationMs: (t1 - t0).toFixed(4),
    };
  });

  // 💬 Electron Dialogs & Native Integration
  ipcMain.handle("dialog:show-open", async () => {
    if (!mainWindow) return { canceled: true };
    return await dialog.showOpenDialog(mainWindow, {
      title: "Select Document",
      filters: [{ name: "All Files", extensions: ["*"] }, { name: "JSON Config", extensions: ["json"] }],
    });
  });

  ipcMain.handle("dialog:show-message", async (_event, title: string, message: string) => {
    if (!mainWindow) return;
    return await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: title || "PicoTS Verification",
      message: message || "Electron dialog API invoked successfully.",
      buttons: ["OK", "Cancel"],
    });
  });

  ipcMain.handle("notification:send", async (_event, title: string, body: string) => {
    new Notification({
      title: title || "PicoTS Notification",
      body: body || "Native desktop notification triggered from Electron IPC!",
    }).show();
    return true;
  });

  ipcMain.handle("clipboard:write", async (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle("clipboard:read", async () => {
    return clipboard.readText();
  });

  // 🗄️ In-Memory Data Store Handlers
  ipcMain.handle("store:get-items", async () => {
    return STORE_ITEMS;
  });

  ipcMain.handle("store:add-item", async (_event, itemData: Omit<RecordItem, "id" | "createdAt">) => {
    const newItem: RecordItem = {
      ...itemData,
      id: `rec_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    STORE_ITEMS.unshift(newItem);
    return newItem;
  });

  ipcMain.handle("store:delete-item", async (_event, id: string) => {
    const index = STORE_ITEMS.findIndex((i) => i.id === id);
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
