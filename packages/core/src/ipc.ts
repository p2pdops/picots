export interface IpcMainInvokeEvent {
  sender: any;
  channel: string;
}

export type IpcMainHandler = (event: IpcMainInvokeEvent, ...args: any[]) => any | Promise<any>;
export type IpcRendererListener = (event: any, ...args: any[]) => void;

export interface ElectronAPIBridge {
  [channel: string]: ((...args: any[]) => Promise<any>) | any;
  invoke(channel: string, ...args: any[]): Promise<any>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, listener: IpcRendererListener): any;
  once(channel: string, listener: IpcRendererListener): any;
  removeListener(channel: string, listener: IpcRendererListener): any;
  removeAllListeners(channel?: string): any;
}

declare global {
  interface Window {
    electronAPI: ElectronAPIBridge;
    picotsAPI: ElectronAPIBridge;
    ipcRenderer: IpcRendererManager;
  }
}

export class IpcMainManager {
  private _handlers: Map<string, IpcMainHandler> = new Map();
  private _listeners: Map<string, Function[]> = new Map();

  constructor() {
    (globalThis as any).__picots_ipc_main = this;
    if (typeof process !== "undefined" && typeof window === "undefined") {
      this._startDevBridge();
    }
  }

  private _startDevBridge(): void {
    const port = parseInt(process.env.PICOTS_IPC_PORT || "5174", 10);
    const self = this;
    try {
      const http = typeof require !== "undefined" ? require("node:http") : null;
      if (http && typeof http.createServer === "function") {
        const server = http.createServer(async (req: any, res: any) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.url === "/__picots_ipc" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk: any) => {
              body += chunk;
            });
            req.on("end", async () => {
              try {
                const { channel, args } = JSON.parse(body || "{}");
                const result = await self._dispatch(channel, ...(args || []));
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ result }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err?.message || String(err) }));
              }
            });
            return;
          }

          res.statusCode = 404;
          res.end();
        });

        server.on("error", (err: any) => {
          if (err.code !== "EADDRINUSE") {
            console.warn("⚠️ [PicoTS] Dev IPC Bridge warning:", err.message);
          }
        });

        server.listen(port, "127.0.0.1", () => {
          console.log(`📡 [PicoTS] Dev IPC Bridge listening on http://127.0.0.1:${port}/__picots_ipc`);
        });
      }
    } catch (err) {}
  }

  /**
   * Handles an asynchronous IPC call from `ipcRenderer.invoke(channel, ...args)`.
   */
  handle(channel: string, listener: IpcMainHandler): void {
    if (this._handlers.has(channel)) {
      throw new Error(`Attempted to register a second handler for '${channel}'`);
    }
    this._handlers.set(channel, listener);
  }

  /**
   * Handles a single invocation then removes itself.
   */
  handleOnce(channel: string, listener: IpcMainHandler): void {
    const onceWrapper = async (event: IpcMainInvokeEvent, ...args: any[]) => {
      this.removeHandler(channel);
      return await listener(event, ...args);
    };
    this.handle(channel, onceWrapper);
  }

  removeHandler(channel: string): void {
    this._handlers.delete(channel);
  }

  on(channel: string, listener: Function): void {
    if (!this._listeners.has(channel)) {
      this._listeners.set(channel, []);
    }
    this._listeners.get(channel)!.push(listener);
  }

  removeListener(channel: string, listener: Function): void {
    const list = this._listeners.get(channel);
    if (list) {
      this._listeners.set(channel, list.filter((l) => l !== listener));
    }
  }

  once(channel: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(channel, onceWrapper);
      listener(...args);
    };
    this.on(channel, onceWrapper);
  }

  removeAllListeners(channel?: string): void {
    if (channel) {
      this._listeners.delete(channel);
    } else {
      this._listeners.clear();
    }
  }

  emit(channel: string, ...args: any[]): void {
    const list = this._listeners.get(channel);
    if (list) {
      for (const listener of list) {
        try {
          listener({ sender: null, channel }, ...args);
        } catch (err) {
          console.error(`Error in ipcMain listener for "${channel}":`, err);
        }
      }
    }
  }

  /**
   * Internal dispatcher called by native COM IPC bridge.
   */
  async _dispatch(channel: string, ...args: any[]): Promise<any> {
    const handler = this._handlers.get(channel);
    if (handler) {
      const event: IpcMainInvokeEvent = { sender: null, channel };
      return await handler(event, ...args);
    }
    const list = this._listeners.get(channel);
    if (list && list.length > 0) {
      for (const listener of list) {
        listener({ channel }, ...args);
      }
      return { status: "ok" };
    }
    throw new Error(`No handler registered for '${channel}' in ipcMain`);
  }
}

export class IpcRendererManager {
  private _listeners: Map<string, IpcRendererListener[]> = new Map();

  constructor() {
    // Expose internal receiver and window.electronAPI / window.picotsAPI for seamless Electron compatibility
    if (typeof window !== "undefined") {
      (window as any).__picots_ipc_receive = (channel: string, ...args: any[]) => {
        const list = this._listeners.get(channel);
        if (list) {
          for (const listener of list) {
            listener({ channel }, ...args);
          }
        }
      };

      // Standard Electron Preload window.electronAPI drop-in compatibility with dynamic channel proxy
      const baseBridge: any = {
        invoke: (channel: string, ...args: any[]) => this.invoke(channel, ...args),
        send: (channel: string, ...args: any[]) => this.send(channel, ...args),
        on: (channel: string, listener: IpcRendererListener) => this.on(channel, listener),
        once: (channel: string, listener: IpcRendererListener) => this.once(channel, listener),
        removeListener: (channel: string, listener: IpcRendererListener) => this.removeListener(channel, listener),
        removeAllListeners: (channel?: string) => this.removeAllListeners(channel),
      };

      const apiBridge = new Proxy(baseBridge, {
        get: (target: any, prop: string | symbol) => {
          if (typeof prop === "string" && prop in target) {
            return target[prop];
          }
          if (typeof prop === "string") {
            // Supports both invocations and event listener subscriptions with cleanup return
            return (...args: any[]) => {
              if (typeof args[0] === "function") {
                const cb = args[0];
                const listener: IpcRendererListener = (_event, ...data) => cb(...data);
                this.on(prop, listener);
                return () => this.removeListener(prop, listener);
              }
              return this.invoke(prop, ...args);
            };
          }
          return target[prop];
        },
      });

      (window as any).electronAPI = (window as any).electronAPI || apiBridge;
      (window as any).picotsAPI = (window as any).picotsAPI || apiBridge;
      (window as any).ipcRenderer = (window as any).ipcRenderer || this;

      // Automatic window dragging for elements with .drag-region, -webkit-app-region: drag, or data-picots-drag
      if (typeof document !== "undefined") {
        document.addEventListener("mousedown", (e: MouseEvent) => {
          if (e.button !== 0) return;
          const target = e.target as HTMLElement | null;
          if (!target) return;
          const isNoDrag = target.closest(".no-drag, button, input, textarea, a, select, [data-no-drag]");
          if (isNoDrag) return;
          const isDrag = target.closest(".drag-region, [data-picots-drag], [data-tauri-drag-region], [style*='app-region: drag'], [style*='app-region:drag']");
          if (isDrag) {
            this.invoke("window_start_drag").catch(() => {});
          }
        });
      }
    }
  }

  /**
   * Invokes a registered `ipcMain.handle(channel)` on the native backend.
   * Transports over zero-HTTP direct in-memory COM dispatch.
   */
  async invoke(channel: string, ...args: any[]): Promise<any> {
    // 1. Direct native function match if available on window
    const normalizedName = channel.replace(/[^a-zA-Z0-9_]/g, "_");
    if (typeof (globalThis as any)[normalizedName] === "function") {
      const raw = await (globalThis as any)[normalizedName](...args);
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    // 2. Generic native invoke dispatcher
    if (typeof (globalThis as any).invoke === "function") {
      const res = await (globalThis as any).invoke(channel, ...args);
      return typeof res === "string" ? JSON.parse(res) : res;
    }

    // 3. Dev Mode cross-process IPC Bridge over HTTP
    if (typeof window !== "undefined" && typeof fetch === "function") {
      try {
        const port = 5174;
        const resp = await fetch(`http://localhost:${port}/__picots_ipc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel, args }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.error) throw new Error(data.error);
          return data.result;
        }
      } catch (err: any) {
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
          throw err;
        }
      }
    }

    // 4. In-process fallback
    if (ipcMain) {
      return await ipcMain._dispatch(channel, ...args);
    }

    throw new Error(`Failed to invoke IPC channel '${channel}': no backend handler active.`);
  }

  /**
   * Sends an asynchronous message to the main process.
   */
  send(channel: string, ...args: any[]): void {
    this.invoke(channel, ...args).catch(() => {});
  }

  on(channel: string, listener: IpcRendererListener): this {
    if (!this._listeners.has(channel)) {
      this._listeners.set(channel, []);
    }
    this._listeners.get(channel)!.push(listener);
    return this;
  }

  once(channel: string, listener: IpcRendererListener): this {
    const onceWrapper = (event: any, ...args: any[]) => {
      this.removeListener(channel, onceWrapper);
      listener(event, ...args);
    };
    return this.on(channel, onceWrapper);
  }

  removeListener(channel: string, listener: IpcRendererListener): this {
    const list = this._listeners.get(channel);
    if (list) {
      this._listeners.set(channel, list.filter((l) => l !== listener));
    }
    return this;
  }

  removeAllListeners(channel?: string): this {
    if (channel) {
      this._listeners.delete(channel);
    } else {
      this._listeners.clear();
    }
    return this;
  }
}

export const ipcMain = new IpcMainManager();
export const ipcRenderer = new IpcRendererManager();
