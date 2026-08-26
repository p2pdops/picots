export interface IpcMainInvokeEvent {
  sender: any;
  channel: string;
}

export type IpcMainHandler = (event: IpcMainInvokeEvent, ...args: any[]) => any | Promise<any>;
export type IpcRendererListener = (event: any, ...args: any[]) => void;

export class IpcMainManager {
  private _handlers: Map<string, IpcMainHandler> = new Map();
  private _listeners: Map<string, Function[]> = new Map();

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
    // Expose internal receiver on window for push events from backend
    if (typeof window !== "undefined") {
      (window as any).__picots_ipc_receive = (channel: string, ...args: any[]) => {
        const list = this._listeners.get(channel);
        if (list) {
          for (const listener of list) {
            listener({ channel }, ...args);
          }
        }
      };
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

    // 2. Generic invoke dispatcher
    if (typeof (globalThis as any).invoke === "function") {
      const res = await (globalThis as any).invoke(channel, ...args);
      return typeof res === "string" ? JSON.parse(res) : res;
    }

    // 3. Fallback to in-process ipcMain dispatch if executing in unified process
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
