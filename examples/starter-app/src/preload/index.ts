import { contextBridge, ipcRenderer } from "@picots/core";

export interface InvoiceDTO {
  invoiceNumber: string;
  customerName?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalAmount: number;
  paymentMode: "CASH" | "UPI" | "CARD";
  timestamp?: string;
}

export interface ItemDTO {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
}

export interface AppStateDTO {
  appName: string;
  version: string;
  isOnline: boolean;
  activeProfile: string;
  environment: string;
  uptimeSeconds: number;
}

const electronAPI = {
  // 🪟 Window Controls
  "window:minimize": () => ipcRenderer.invoke("window:minimize"),
  "window:maximize": () => ipcRenderer.invoke("window:maximize"),
  "window:is-maximized": () => ipcRenderer.invoke("window:is-maximized"),
  "window:close": () => ipcRenderer.invoke("window:close"),
  "window:toggle-fullscreen": () => ipcRenderer.invoke("window:toggle-fullscreen"),

  // ⚙️ App & System State
  "app:get-state": (): Promise<AppStateDTO> => ipcRenderer.invoke("app:get-state"),
  "app:save-settings": (settings: Record<string, any>) => ipcRenderer.invoke("app:save-settings", settings),
  "app:get-system-info": () => ipcRenderer.invoke("get-user-profile", "usr_preload_01"),

  // 📦 Items & Catalog (POS)
  "items:search": (query: string): Promise<ItemDTO[]> => ipcRenderer.invoke("items:search", query),
  "items:get-all": (): Promise<ItemDTO[]> => ipcRenderer.invoke("items:get-all"),

  // 💳 Transactions & Sales Billing
  "pos:save-invoice": (invoice: InvoiceDTO): Promise<{ success: boolean; invoiceId: string; receiptUrl: string }> => 
    ipcRenderer.invoke("pos:save-invoice", invoice),
  "sales:get-history": (filters?: { limit?: number }): Promise<any[]> => 
    ipcRenderer.invoke("sales:get-history", filters),

  // 💬 Messaging & Notifications
  "whatsapp:send-test-message": (phone: string, text: string) => 
    ipcRenderer.invoke("whatsapp:send-test-message", phone, text),

  // 📡 Real-time Push Event Subscriptions
  "events:on-notification": (callback: (data: { id: string; title: string; message: string; time: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on("events:notification-received", handler);
    return () => {
      ipcRenderer.removeListener("events:notification-received", handler);
    };
  },
  "events:trigger-mock-event": (title: string, message: string) => {
    ipcRenderer.send("events:trigger-mock", { title, message });
  },
};

// Expose onto window.electronAPI matching Electron's contextBridge
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
