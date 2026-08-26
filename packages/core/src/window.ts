export interface WebPreferences {
  nodeIntegration?: boolean;
  contextIsolation?: boolean;
  preload?: string;
  devTools?: boolean;
}

export interface BrowserWindowConstructorOptions {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  focusable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  skipTaskbar?: boolean;
  frame?: boolean;
  frameless?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  darkTheme?: boolean;
  show?: boolean;
  center?: boolean;
  webPreferences?: WebPreferences;
  icon?: string;
}

export class BrowserWindow {
  public title: string;
  public width: number;
  public height: number;
  private _isDestroyed: boolean = false;
  private _listeners: Map<string, Function[]> = new Map();

  public webContents = {
    send: (channel: string, ...args: any[]) => {
      // IPC dispatch to frontend
      if (typeof (globalThis as any).eval === "function") {
        const payload = JSON.stringify(args);
        (globalThis as any).eval?.(`window.__picots_ipc_receive?.("${channel}", ...${payload})`);
      }
    },
    executeJavaScript: async (code: string): Promise<any> => {
      if (typeof (globalThis as any).eval === "function") {
        return (globalThis as any).eval(code);
      }
      return null;
    },
    openDevTools: () => {
      // WebView2 devtools
    },
    closeDevTools: () => {},
  };

  constructor(options: BrowserWindowConstructorOptions = {}) {
    this.title = options.title || "PicoTS App";
    this.width = options.width || 1180;
    this.height = options.height || 780;
  }

  async loadURL(url: string): Promise<void> {
    if (typeof (globalThis as any).navigate === "function") {
      await (globalThis as any).navigate(url);
    }
  }

  async loadFile(filePath: string): Promise<void> {
    await this.loadURL(`file://${filePath}`);
  }

  async minimize(): Promise<void> {
    if (typeof (globalThis as any).window_minimize === "function") {
      await (globalThis as any).window_minimize();
    }
    this.emit("minimize");
  }

  async maximize(): Promise<void> {
    if (typeof (globalThis as any).window_maximize === "function") {
      await (globalThis as any).window_maximize();
    }
    this.emit("maximize");
  }

  async unmaximize(): Promise<void> {
    await this.maximize();
    this.emit("unmaximize");
  }

  async isMaximized(): Promise<boolean> {
    return false;
  }

  async hide(): Promise<void> {
    if (typeof (globalThis as any).window_hide === "function") {
      await (globalThis as any).window_hide();
    }
    this.emit("hide");
  }

  async show(): Promise<void> {
    if (typeof (globalThis as any).window_show === "function") {
      await (globalThis as any).window_show();
    }
    this.emit("show");
  }

  async isVisible(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {
    this.emit("close");
    if (typeof (globalThis as any).window_close === "function") {
      await (globalThis as any).window_close();
    }
    this._isDestroyed = true;
    this.emit("closed");
  }

  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  on(event: string, listener: Function): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  removeListener(event: string, listener: Function): this {
    const list = this._listeners.get(event);
    if (list) {
      this._listeners.set(event, list.filter((l) => l !== listener));
    }
    return this;
  }

  private emit(event: string, ...args: any[]) {
    const list = this._listeners.get(event);
    if (list) {
      for (const listener of list) {
        try {
          listener(...args);
        } catch (err) {
          console.error(`Error in BrowserWindow listener for "${event}":`, err);
        }
      }
    }
  }
}

// Window is an alias for BrowserWindow for flexibility
export const Window = BrowserWindow;
export type WindowOptions = BrowserWindowConstructorOptions;
