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
export declare class ScreenManager {
    private _listeners;
    /**
     * Returns the Primary Display monitor.
     */
    getPrimaryDisplay(): Display;
    /**
     * Returns an array of all connected display monitors.
     */
    getAllDisplays(): Display[];
    /**
     * Returns the current absolute mouse cursor position on screen.
     */
    getCursorScreenPoint(): Point;
    /**
     * Returns the display nearest the specified point.
     */
    getDisplayNearestPoint(point: Point): Display;
    /**
     * Returns the display that most closely intersects the provided bounds.
     */
    getDisplayMatching(rect: Rectangle): Display;
    on(event: "display-added" | "display-removed" | "display-metrics-changed", listener: Function): this;
    removeListener(event: string, listener: Function): this;
}
export declare const screen: ScreenManager;
//# sourceMappingURL=screen.d.ts.map