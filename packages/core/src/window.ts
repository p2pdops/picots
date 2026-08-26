export interface WindowOptions {
  title?: string;
  width?: number;
  height?: number;
  frameless?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export class Window {
  public title: string;
  public width: number;
  public height: number;

  constructor(options: WindowOptions = {}) {
    this.title = options.title || "PicoTS App";
    this.width = options.width || 1180;
    this.height = options.height || 780;
  }

  async minimize(): Promise<void> {
    if (typeof (globalThis as any).window_minimize === "function") {
      await (globalThis as any).window_minimize();
    }
  }

  async maximize(): Promise<void> {
    if (typeof (globalThis as any).window_maximize === "function") {
      await (globalThis as any).window_maximize();
    }
  }

  async close(): Promise<void> {
    if (typeof (globalThis as any).window_close === "function") {
      await (globalThis as any).window_close();
    }
  }

  async hide(): Promise<void> {
    if (typeof (globalThis as any).window_hide === "function") {
      await (globalThis as any).window_hide();
    }
  }

  async show(): Promise<void> {
    if (typeof (globalThis as any).window_show === "function") {
      await (globalThis as any).window_show();
    }
  }
}
