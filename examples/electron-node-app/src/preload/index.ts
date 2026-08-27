import { contextBridge, ipcRenderer } from "electron";
import type { RecordItem, ActivityLog } from "../main/db";

const electronAPI = {
  // Window Controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  close: () => ipcRenderer.invoke("window:close"),

  // Node.js Runtime Verification
  getNodeSystemInfo: (): Promise<{
    hostname: string;
    platform: string;
    arch: string;
    homedir: string;
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    sampleUuid: string;
    sampleHash: string;
    joinedPath: string;
    latencyMs: string;
  }> => ipcRenderer.invoke("node:get-system-info"),

  runFsBenchmark: (recordCount?: number): Promise<{
    success: boolean;
    records: number;
    bytesWritten: number;
    writeDurationMs: string;
    readDurationMs: string;
  }> => ipcRenderer.invoke("node:fs-benchmark", recordCount),

  computeCryptoHash: (text: string, algorithm?: string): Promise<{
    algorithm: string;
    inputLength: number;
    hash: string;
    durationMs: string;
  }> => ipcRenderer.invoke("node:crypto-compute", text, algorithm),

  // Electron Dialogs & UI
  showOpenDialog: () => ipcRenderer.invoke("dialog:show-open"),
  showMessageBox: (title: string, message: string) => ipcRenderer.invoke("dialog:show-message", title, message),
  sendNotification: (title: string, body: string) => ipcRenderer.invoke("notification:send", title, body),
  writeClipboard: (text: string) => ipcRenderer.invoke("clipboard:write", text),
  readClipboard: (): Promise<string> => ipcRenderer.invoke("clipboard:read"),

  // Data Store
  getItems: (): Promise<RecordItem[]> => ipcRenderer.invoke("store:get-items"),
  addItem: (item: Omit<RecordItem, "id" | "createdAt">): Promise<RecordItem> => ipcRenderer.invoke("store:add-item", item),
  deleteItem: (id: string): Promise<boolean> => ipcRenderer.invoke("store:delete-item", id),
  getLogs: (): Promise<ActivityLog[]> => ipcRenderer.invoke("store:get-logs"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
