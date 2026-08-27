export class BrowserWindow {
    title;
    width;
    height;
    x = 0;
    y = 0;
    _isDestroyed = false;
    _isMaximized = false;
    _isMinimized = false;
    _isFullScreen = false;
    _isAlwaysOnTop = false;
    _isFocused = true;
    _opacity = 1.0;
    _resizable = true;
    _movable = true;
    _minWidth = 0;
    _minHeight = 0;
    _maxWidth = 10000;
    _maxHeight = 10000;
    _listeners = new Map();
    webContents = {
        send: (channel, ...args) => {
            // IPC dispatch to frontend
            if (typeof globalThis.eval === "function") {
                const payload = JSON.stringify(args);
                globalThis.eval?.(`window.__picots_ipc_receive?.("${channel}", ...${payload})`);
            }
        },
        executeJavaScript: async (code) => {
            if (typeof globalThis.eval === "function") {
                return globalThis.eval(code);
            }
            return null;
        },
        openDevTools: () => { },
        closeDevTools: () => { },
        isDevToolsOpened: () => true,
        reload: () => {
            if (typeof globalThis.eval === "function") {
                globalThis.eval("window.location.reload()");
            }
        },
        setZoomFactor: (factor) => {
            if (typeof globalThis.eval === "function") {
                globalThis.eval(`document.body.style.zoom = "${factor}"`);
            }
        },
        setWindowOpenHandler: (handler) => { },
        on: (event, listener) => { },
        once: (event, listener) => { },
        removeListener: (event, listener) => { },
        print: async (options = {}, callback) => {
            if (typeof globalThis.eval === "function") {
                globalThis.eval("window.print()");
                if (callback)
                    callback(true);
            }
        },
        printToPDF: async (options = {}) => {
            return Buffer.from("%PDF-1.4\n%%EOF");
        },
        capturePage: async (rect) => {
            return {
                toPNG: () => Buffer.from(""),
                toJPEG: (quality) => Buffer.from(""),
                toBitmap: () => Buffer.from(""),
                toDataURL: () => "data:image/png;base64,",
                isEmpty: () => false,
                getSize: () => ({ width: 440, height: 900 }),
            };
        },
        getPrintersAsync: async () => {
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
    destroy() {
        this.close();
    }
    constructor(options = {}) {
        this.title = options.title || "PicoTS App";
        this.width = options.width || 1180;
        this.height = options.height || 780;
        this.x = options.x || 100;
        this.y = options.y || 100;
        this._resizable = options.resizable !== false;
        this._movable = options.movable !== false;
        this._isAlwaysOnTop = !!options.alwaysOnTop;
        this._opacity = options.opacity ?? 1.0;
        if (options.minWidth)
            this._minWidth = options.minWidth;
        if (options.minHeight)
            this._minHeight = options.minHeight;
        if (options.maxWidth)
            this._maxWidth = options.maxWidth;
        if (options.maxHeight)
            this._maxHeight = options.maxHeight;
        BrowserWindow._allWindows.push(this);
    }
    async loadURL(url) {
        if (typeof globalThis.navigate === "function") {
            await globalThis.navigate(url);
        }
    }
    async loadFile(filePath) {
        await this.loadURL(`file://${filePath}`);
    }
    async setSize(width, height, animate) {
        this.width = width;
        this.height = height;
        if (typeof globalThis.window_set_size === "function") {
            await globalThis.window_set_size(width, height);
        }
        this.emit("resize");
    }
    getSize() {
        return [this.width, this.height];
    }
    async setPosition(x, y, animate) {
        this.x = x;
        this.y = y;
        if (typeof globalThis.window_set_position === "function") {
            await globalThis.window_set_position(x, y);
        }
        this.emit("move");
    }
    getPosition() {
        return [this.x, this.y];
    }
    async center() {
        if (typeof globalThis.window_center === "function") {
            await globalThis.window_center();
        }
    }
    async startDrag() {
        if (typeof globalThis.window_start_drag === "function") {
            await globalThis.window_start_drag();
        }
    }
    async setFrame(frame) {
        if (typeof globalThis.window_set_frame === "function") {
            await globalThis.window_set_frame(frame);
        }
    }
    async setFrameless(frameless) {
        await this.setFrame(!frameless);
    }
    async setAlwaysOnTop(flag, level) {
        this._isAlwaysOnTop = flag;
        if (typeof globalThis.window_set_always_on_top === "function") {
            await globalThis.window_set_always_on_top(flag);
        }
    }
    isAlwaysOnTop() {
        return this._isAlwaysOnTop;
    }
    async setOpacity(opacity) {
        this._opacity = Math.max(0, Math.min(1, opacity));
        if (typeof globalThis.window_set_opacity === "function") {
            await globalThis.window_set_opacity(this._opacity);
        }
    }
    getOpacity() {
        return this._opacity;
    }
    setTitle(title) {
        this.title = title;
        if (typeof globalThis.set_title === "function") {
            globalThis.set_title(title);
        }
    }
    getTitle() {
        return this.title;
    }
    setResizable(resizable) {
        this._resizable = resizable;
    }
    isResizable() {
        return this._resizable;
    }
    setMovable(movable) {
        this._movable = movable;
    }
    isMovable() {
        return this._movable;
    }
    setMinimumSize(width, height) {
        this._minWidth = width;
        this._minHeight = height;
    }
    getMinimumSize() {
        return [this._minWidth, this._minHeight];
    }
    setMaximumSize(width, height) {
        this._maxWidth = width;
        this._maxHeight = height;
    }
    getMaximumSize() {
        return [this._maxWidth, this._maxHeight];
    }
    async minimize() {
        this._isMinimized = true;
        if (typeof globalThis.window_minimize === "function") {
            await globalThis.window_minimize();
        }
        this.emit("minimize");
    }
    async maximize() {
        this._isMaximized = true;
        if (typeof globalThis.window_maximize === "function") {
            await globalThis.window_maximize();
        }
        this.emit("maximize");
    }
    async unmaximize() {
        this._isMaximized = false;
        if (typeof globalThis.window_unmaximize === "function") {
            await globalThis.window_unmaximize();
        }
        this.emit("unmaximize");
    }
    isMaximized() {
        return this._isMaximized;
    }
    isMinimized() {
        return this._isMinimized;
    }
    async setFullScreen(flag) {
        this._isFullScreen = flag;
        if (flag) {
            this.emit("enter-full-screen");
        }
        else {
            this.emit("leave-full-screen");
        }
    }
    isFullScreen() {
        return this._isFullScreen;
    }
    async flashFrame(flag) {
        if (typeof globalThis.window_flash_frame === "function") {
            await globalThis.window_flash_frame(flag);
        }
    }
    async hide() {
        if (typeof globalThis.window_hide === "function") {
            await globalThis.window_hide();
        }
        this.emit("hide");
    }
    async show() {
        if (typeof globalThis.window_show === "function") {
            await globalThis.window_show();
        }
        this.emit("show");
    }
    async isVisible() {
        return true;
    }
    focus() {
        this._isFocused = true;
        this.emit("focus");
    }
    blur() {
        this._isFocused = false;
        this.emit("blur");
    }
    isFocused() {
        return this._isFocused;
    }
    async close() {
        this.emit("close");
        if (typeof globalThis.window_close === "function") {
            await globalThis.window_close();
        }
        this._isDestroyed = true;
        this.emit("closed");
    }
    isDestroyed() {
        return this._isDestroyed;
    }
    async restore() {
        await this.unmaximize();
        this.emit("restore");
    }
    on(event, listener) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(listener);
        return this;
    }
    once(event, listener) {
        const onceWrapper = (...args) => {
            this.removeListener(event, onceWrapper);
            listener(...args);
        };
        return this.on(event, onceWrapper);
    }
    removeListener(event, listener) {
        const list = this._listeners.get(event);
        if (list) {
            this._listeners.set(event, list.filter((l) => l !== listener));
        }
        return this;
    }
    emit(event, ...args) {
        const list = this._listeners.get(event);
        if (list) {
            for (const listener of list) {
                try {
                    listener(...args);
                }
                catch (err) {
                    console.error(`Error in BrowserWindow listener for "${event}":`, err);
                }
            }
        }
    }
    static _allWindows = [];
    static getAllWindows() {
        return BrowserWindow._allWindows.filter((w) => !w._isDestroyed);
    }
    static getFocusedWindow() {
        return BrowserWindow.getAllWindows().find((w) => w.isFocused()) || BrowserWindow.getAllWindows()[0] || null;
    }
    static fromWebContents(contents) {
        return BrowserWindow.getFocusedWindow();
    }
    static fromId(id) {
        return BrowserWindow.getAllWindows()[0] || null;
    }
}
// Window is an alias for BrowserWindow for flexibility
export const Window = BrowserWindow;
