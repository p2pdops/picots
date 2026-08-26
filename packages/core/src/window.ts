export interface WebPreferences {
  nodeIntegration?: boolean;
  contextIsolation?: boolean;
  preload?: string;
  devTools?: boolean;
  zoomFactor?: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface PrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
  color?: boolean;
  margins?: {
    marginType?: "default" | "none" | "printableArea" | "custom";
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  landscape?: boolean;
  scaleFactor?: number;
  pagesPerSheet?: number;
  collate?: boolean;
  copies?: number;
  header?: string;
  footer?: string;
  pageSize?: "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid" | { width: number; height: number };
}

export interface PrintToPDFOptions {
  landscape?: boolean;
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  scale?: number;
  paperWidth?: number;
  paperHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  pageRanges?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  preferCSSPageSize?: boolean;
}

export interface BrowserWindowConstructorOptions {
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
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
  opacity?: number;
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
  public x: number = 0;
  public y: number = 0;
  private _isDestroyed: boolean = false;
  private _isMaximized: boolean = false;
  private _isMinimized: boolean = false;
  private _isFullScreen: boolean = false;
  private _isAlwaysOnTop: boolean = false;
  private _isFocused: boolean = true;
  private _opacity: number = 1.0;
  private _resizable: boolean = true;
  private _movable: boolean = true;
  private _minWidth: number = 0;
  private _minHeight: number = 0;
  private _maxWidth: number = 10000;
  private _maxHeight: number = 10000;
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
    openDevTools: () => {},
    closeDevTools: () => {},
    isDevToolsOpened: () => true,
    reload: () => {
      if (typeof (globalThis as any).eval === "function") {
        (globalThis as any).eval("window.location.reload()");
      }
    },
    setZoomFactor: (factor: number) => {
      if (typeof (globalThis as any).eval === "function") {
        (globalThis as any).eval(`document.body.style.zoom = "${factor}"`);
      }
    },
    getZoomFactor: (): number => 1.0,
    print: async (options: PrintOptions = {}, callback?: (success: boolean, failureReason?: string) => void) => {
      if (typeof (globalThis as any).eval === "function") {
        (globalThis as any).eval("window.print()");
        if (callback) callback(true);
      }
    },
    printToPDF: async (options: PrintToPDFOptions = {}): Promise<string> => {
      return "data:application/pdf;base64,";
    },
    getPrintersAsync: async (): Promise<PrinterInfo[]> => {
      return [
        {
          name: "Default Printer",
          displayName: "System Default Printer",
          description: "Active OS Printer",
          status: 0,
          isDefault: true,
        },
      ];
    },
  };

  constructor(options: BrowserWindowConstructorOptions = {}) {
    this.title = options.title || "PicoTS App";
    this.width = options.width || 1180;
    this.height = options.height || 780;
    this.x = options.x || 100;
    this.y = options.y || 100;
    this._resizable = options.resizable !== false;
    this._movable = options.movable !== false;
    this._isAlwaysOnTop = !!options.alwaysOnTop;
    this._opacity = options.opacity ?? 1.0;
    if (options.minWidth) this._minWidth = options.minWidth;
    if (options.minHeight) this._minHeight = options.minHeight;
    if (options.maxWidth) this._maxWidth = options.maxWidth;
    if (options.maxHeight) this._maxHeight = options.maxHeight;
  }

  async loadURL(url: string): Promise<void> {
    if (typeof (globalThis as any).navigate === "function") {
      await (globalThis as any).navigate(url);
    }
  }

  async loadFile(filePath: string): Promise<void> {
    await this.loadURL(`file://${filePath}`);
  }

  async setSize(width: number, height: number, animate?: boolean): Promise<void> {
    this.width = width;
    this.height = height;
    if (typeof (globalThis as any).window_set_size === "function") {
      await (globalThis as any).window_set_size(width, height);
    }
    this.emit("resize");
  }

  getSize(): [number, number] {
    return [this.width, this.height];
  }

  async setPosition(x: number, y: number, animate?: boolean): Promise<void> {
    this.x = x;
    this.y = y;
    if (typeof (globalThis as any).window_set_position === "function") {
      await (globalThis as any).window_set_position(x, y);
    }
    this.emit("move");
  }

  getPosition(): [number, number] {
    return [this.x, this.y];
  }

  async center(): Promise<void> {
    if (typeof (globalThis as any).window_center === "function") {
      await (globalThis as any).window_center();
    }
  }

  async startDrag(): Promise<void> {
    if (typeof (globalThis as any).window_start_drag === "function") {
      await (globalThis as any).window_start_drag();
    }
  }

  async setFrame(frame: boolean): Promise<void> {
    if (typeof (globalThis as any).window_set_frame === "function") {
      await (globalThis as any).window_set_frame(frame);
    }
  }

  async setFrameless(frameless: boolean): Promise<void> {
    await this.setFrame(!frameless);
  }

  async setAlwaysOnTop(flag: boolean, level?: string): Promise<void> {
    this._isAlwaysOnTop = flag;
    if (typeof (globalThis as any).window_set_always_on_top === "function") {
      await (globalThis as any).window_set_always_on_top(flag);
    }
  }

  isAlwaysOnTop(): boolean {
    return this._isAlwaysOnTop;
  }

  async setOpacity(opacity: number): Promise<void> {
    this._opacity = Math.max(0, Math.min(1, opacity));
    if (typeof (globalThis as any).window_set_opacity === "function") {
      await (globalThis as any).window_set_opacity(this._opacity);
    }
  }

  getOpacity(): number {
    return this._opacity;
  }

  setTitle(title: string): void {
    this.title = title;
    if (typeof (globalThis as any).set_title === "function") {
      (globalThis as any).set_title(title);
    }
  }

  getTitle(): string {
    return this.title;
  }

  setResizable(resizable: boolean): void {
    this._resizable = resizable;
  }

  isResizable(): boolean {
    return this._resizable;
  }

  setMovable(movable: boolean): void {
    this._movable = movable;
  }

  isMovable(): boolean {
    return this._movable;
  }

  setMinimumSize(width: number, height: number): void {
    this._minWidth = width;
    this._minHeight = height;
  }

  getMinimumSize(): [number, number] {
    return [this._minWidth, this._minHeight];
  }

  setMaximumSize(width: number, height: number): void {
    this._maxWidth = width;
    this._maxHeight = height;
  }

  getMaximumSize(): [number, number] {
    return [this._maxWidth, this._maxHeight];
  }

  async minimize(): Promise<void> {
    this._isMinimized = true;
    if (typeof (globalThis as any).window_minimize === "function") {
      await (globalThis as any).window_minimize();
    }
    this.emit("minimize");
  }

  async maximize(): Promise<void> {
    this._isMaximized = true;
    if (typeof (globalThis as any).window_maximize === "function") {
      await (globalThis as any).window_maximize();
    }
    this.emit("maximize");
  }

  async unmaximize(): Promise<void> {
    this._isMaximized = false;
    if (typeof (globalThis as any).window_unmaximize === "function") {
      await (globalThis as any).window_unmaximize();
    }
    this.emit("unmaximize");
  }

  isMaximized(): boolean {
    return this._isMaximized;
  }

  isMinimized(): boolean {
    return this._isMinimized;
  }

  async setFullScreen(flag: boolean): Promise<void> {
    this._isFullScreen = flag;
    if (flag) {
      this.emit("enter-full-screen");
    } else {
      this.emit("leave-full-screen");
    }
  }

  isFullScreen(): boolean {
    return this._isFullScreen;
  }

  async flashFrame(flag: boolean): Promise<void> {
    if (typeof (globalThis as any).window_flash_frame === "function") {
      await (globalThis as any).window_flash_frame(flag);
    }
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

  focus(): void {
    this._isFocused = true;
    this.emit("focus");
  }

  blur(): void {
    this._isFocused = false;
    this.emit("blur");
  }

  isFocused(): boolean {
    return this._isFocused;
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
