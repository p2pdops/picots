export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Display {
  id: number;
  label: string;
  bounds: Rectangle;
  workArea: Rectangle;
  scaleFactor: number;
  rotation: number;
  internal: boolean;
  touchSupport: "available" | "unavailable" | "unknown";
  monochrome: boolean;
  accelerometerSupport: "available" | "unavailable" | "unknown";
}

export class ScreenManager {
  private _listeners: Map<string, Function[]> = new Map();

  /**
   * Returns the Primary Display monitor.
   */
  getPrimaryDisplay(): Display {
    const width = typeof window !== "undefined" ? window.screen.width : 1920;
    const height = typeof window !== "undefined" ? window.screen.height : 1080;
    const availWidth = typeof window !== "undefined" ? window.screen.availWidth : 1920;
    const availHeight = typeof window !== "undefined" ? window.screen.availHeight : 1040;
    const scaleFactor = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    return {
      id: 1,
      label: "Primary Display",
      bounds: { x: 0, y: 0, width, height },
      workArea: { x: 0, y: 0, width: availWidth, height: availHeight },
      scaleFactor,
      rotation: 0,
      internal: true,
      touchSupport: "unknown",
      monochrome: false,
      accelerometerSupport: "unknown",
    };
  }

  /**
   * Returns an array of all connected display monitors.
   */
  getAllDisplays(): Display[] {
    return [this.getPrimaryDisplay()];
  }

  /**
   * Returns the current absolute mouse cursor position on screen.
   */
  getCursorScreenPoint(): Point {
    return { x: 0, y: 0 };
  }

  /**
   * Returns the display nearest the specified point.
   */
  getDisplayNearestPoint(point: Point): Display {
    return this.getPrimaryDisplay();
  }

  /**
   * Returns the display that most closely intersects the provided bounds.
   */
  getDisplayMatching(rect: Rectangle): Display {
    return this.getPrimaryDisplay();
  }

  on(event: "display-added" | "display-removed" | "display-metrics-changed", listener: Function): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(listener);
    return this;
  }

  removeListener(event: string, listener: Function): this {
    const list = this._listeners.get(event);
    if (list) {
      this._listeners.set(event, list.filter((l) => l !== listener));
    }
    return this;
  }
}

export const screen = new ScreenManager();
