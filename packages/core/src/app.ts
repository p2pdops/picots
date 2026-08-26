export interface SystemInfo {
  name: string;
  os: string;
  arch: string;
  cwd: string;
  pid: number;
  isScriptcNative: boolean;
  features: string[];
}

export type AppPathName = "home" | "appData" | "userData" | "temp" | "desktop" | "documents" | "downloads" | "exe";

export class AppEventEmitter {
  private _listeners: Map<string, Function[]> = new Map();
  private _isReady: boolean = false;
  private _name: string = "PicoTS App";
  private _version: string = "0.1.0";

  constructor() {
    // Auto-mark as ready on initialization loop
    setTimeout(() => {
      this._isReady = true;
      this.emit("ready");
    }, 0);
  }

  /**
   * Resolves when the PicoTS application lifecycle is ready.
   */
  async whenReady(): Promise<void> {
    if (this._isReady) return;
    return new Promise((resolve) => {
      this.once("ready", () => resolve());
    });
  }

  isReady(): boolean {
    return this._isReady;
  }

  quit(): void {
    if (typeof (globalThis as any).window_close === "function") {
      (globalThis as any).window_close();
    }
    if (typeof process !== "undefined" && typeof process.exit === "function") {
      process.exit(0);
    }
  }

  exit(code: number = 0): void {
    if (typeof process !== "undefined" && typeof process.exit === "function") {
      process.exit(code);
    }
  }

  getName(): string {
    return this._name;
  }

  setName(name: string): void {
    this._name = name;
  }

  getVersion(): string {
    return this._version;
  }

  getPath(name: AppPathName): string {
    if (typeof process !== "undefined") {
      const home = process.env.USERPROFILE || process.env.HOME || "";
      switch (name) {
        case "home": return home;
        case "appData": return process.env.APPDATA || `${home}/AppData/Roaming`;
        case "userData": return `${process.env.APPDATA || `${home}/AppData/Roaming`}/${this._name}`;
        case "temp": return process.env.TEMP || `${home}/AppData/Local/Temp`;
        case "desktop": return `${home}/Desktop`;
        case "documents": return `${home}/Documents`;
        case "downloads": return `${home}/Downloads`;
        case "exe": return process.cwd();
      }
    }
    return "";
  }

  async getSystemInfo(): Promise<SystemInfo | null> {
    if (typeof (globalThis as any).get_system_info === "function") {
      const raw = await (globalThis as any).get_system_info();
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  }

  async benchmark(): Promise<boolean> {
    if (typeof (globalThis as any).benchmark === "function") {
      await (globalThis as any).benchmark();
      return true;
    }
    return false;
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
          console.error(`Error in app listener for "${event}":`, err);
        }
      }
    }
  }
}

export const app = new AppEventEmitter();
