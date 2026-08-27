import { app, BrowserWindow, ipcMain, dialog, clipboard, shell, notification, tray } from "@picots/core";

let mainWindow: BrowserWindow | null = null;

// Mock database for items and sales
const MOCK_ITEMS = [
  { id: "itm_101", name: "Whole Wheat Bread 400g", barcode: "8901234567890", category: "Bakery", price: 45.00, stock: 120 },
  { id: "itm_102", name: "Farm Fresh Milk 1L", barcode: "8901234567891", category: "Dairy", price: 68.00, stock: 85 },
  { id: "itm_103", name: "Organic Brown Eggs (Pack of 6)", barcode: "8901234567892", category: "Poultry", price: 95.00, stock: 40 },
  { id: "itm_104", name: "Filter Coffee Blend 250g", barcode: "8901234567893", category: "Beverages", price: 180.00, stock: 65 },
  { id: "itm_105", name: "Alphonso Mango Pulp 850g", barcode: "8901234567894", category: "Canned Goods", price: 210.00, stock: 30 },
];

const savedInvoices: any[] = [];
let appSettings: Record<string, any> = {
  theme: "dark",
  printerName: "Thermal POS-80",
  currencySymbol: "₹",
  taxRatePercent: 5,
};

app.whenReady().then(async () => {
  mainWindow = new BrowserWindow({
    title: "PicoTS React Desktop",
    width: 1200,
    height: 800,
    frameless: true,
  });

  // Custom Main Process IPC Handlers (Just like Electron's ipcMain.handle)
  ipcMain.handle("get-user-profile", async (event, userId: string) => {
    return {
      id: userId || "usr_dev_01",
      name: "PicoTS Engineer",
      role: "Lead Systems Architect",
      stack: "100% TypeScript + ScriptC Native AOT",
      openPorts: 0,
      binarySize: "446 KB",
      memoryUsageMb: 18.5,
    };
  });

  ipcMain.handle("compute-hash", async (event, input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return { input, hash: "0x" + Math.abs(hash).toString(16).padStart(8, "0") };
  });

  ipcMain.handle("show-open-dialog", async () => {
    return await dialog.showOpenDialog(mainWindow, {
      title: "Select Document",
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
  });

  ipcMain.handle("show-alert", async (event, title: string, message: string) => {
    return await dialog.showMessageBox(mainWindow, {
      title: title || "PicoTS Main Process",
      message: message || "Hello from main/index.ts!",
    });
  });

  // =========================================================================
  // ElectronAPI Compatibility Handlers (Matching zb-dhandha-electron Preload)
  // =========================================================================

  // App & System State
  ipcMain.handle("app:get-state", async () => {
    const isNode = typeof process !== "undefined";
    const env = (isNode && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : "development";
    const uptime = (isNode && typeof process.uptime === "function") 
      ? Math.floor(process.uptime()) 
      : (typeof performance !== "undefined" ? Math.floor(performance.now() / 1000) : 42);

    return {
      appName: "PicoTS Drop-in Electron App",
      version: "1.0.0",
      isOnline: true,
      activeProfile: "SuperAdmin",
      environment: env,
      uptimeSeconds: uptime,
      settings: appSettings,
    };
  });

  ipcMain.handle("app:save-settings", async (event, newSettings: Record<string, any>) => {
    appSettings = { ...appSettings, ...newSettings };
    return { success: true, settings: appSettings };
  });

  // Items & Catalog Queries
  ipcMain.handle("items:get-all", async () => {
    return MOCK_ITEMS;
  });

  ipcMain.handle("items:search", async (event, query: string) => {
    if (!query) return MOCK_ITEMS;
    const q = query.toLowerCase();
    return MOCK_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  });

  // POS Invoicing & Sales History
  ipcMain.handle("pos:save-invoice", async (event, invoice: any) => {
    const invoiceRecord = {
      ...invoice,
      id: "INV-" + (savedInvoices.length + 1001),
      timestamp: new Date().toISOString(),
      status: "PAID",
    };
    savedInvoices.unshift(invoiceRecord);
    return {
      success: true,
      invoiceId: invoiceRecord.id,
      receiptUrl: `picots://receipts/${invoiceRecord.id}.pdf`,
    };
  });

  ipcMain.handle("sales:get-history", async (event, filters?: { limit?: number }) => {
    const limit = filters?.limit || 10;
    return savedInvoices.slice(0, limit);
  });

  // WhatsApp Message Simulation
  ipcMain.handle("whatsapp:send-test-message", async (event, phone: string, text: string) => {
    return {
      status: "SENT",
      recipient: phone,
      messagePreview: text,
      timestamp: new Date().toISOString(),
    };
  });

  // Window Controls
  ipcMain.handle("window:minimize", async () => {
    if (mainWindow) mainWindow.minimize();
    return { status: "minimized" };
  });

  ipcMain.handle("window:maximize", async () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.restore();
      } else {
        mainWindow.maximize();
      }
    }
    return { status: "maximized_toggled" };
  });

  ipcMain.handle("window:is-maximized", async () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle("window:close", async () => {
    if (mainWindow) mainWindow.close();
    return { status: "closed" };
  });

  ipcMain.handle("window:toggle-fullscreen", async () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return { status: "fullscreen_toggled" };
  });

  // Mock Event Dispatcher
  ipcMain.on("events:trigger-mock", (event: any, payload: { title: string; message: string }) => {
    const eventPayload = {
      id: "evt_" + Date.now(),
      title: payload.title || "Notification",
      message: payload.message || "Push event received over IPC",
      time: new Date().toLocaleTimeString(),
    };
    // Emit event back to renderer
    ipcMain.emit("events:notification-received", eventPayload);
  });
});

