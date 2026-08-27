export class AppEventEmitter {
    _listeners = new Map();
    _isReady = false;
    _name = "PicoTS App";
    _version = "0.1.0";
    _hasSingleInstanceLock = true;
    _loginItemSettings = { openAtLogin: false, openAsHidden: false };
    _protocolClients = new Set();
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
    async whenReady() {
        if (this._isReady)
            return;
        return new Promise((resolve) => {
            this.once("ready", () => resolve());
        });
    }
    isReady() {
        return this._isReady;
    }
    /**
     * Makes the application a Single Instance Application.
     * Returns true if this instance obtained the lock.
     */
    requestSingleInstanceLock() {
        return this._hasSingleInstanceLock;
    }
    hasSingleInstanceLock() {
        return this._hasSingleInstanceLock;
    }
    releaseSingleInstanceLock() {
        this._hasSingleInstanceLock = false;
    }
    /**
     * Sets the current executable as the default handler for a custom protocol (e.g. "myapp://").
     */
    setAsDefaultProtocolClient(protocol, path, args) {
        const cleanProtocol = protocol.replace(/:\/\/$/, "");
        this._protocolClients.add(cleanProtocol);
        return true;
    }
    isDefaultProtocolClient(protocol) {
        const cleanProtocol = protocol.replace(/:\/\/$/, "");
        return this._protocolClients.has(cleanProtocol);
    }
    removeAsDefaultProtocolClient(protocol) {
        const cleanProtocol = protocol.replace(/:\/\/$/, "");
        return this._protocolClients.delete(cleanProtocol);
    }
    /**
     * Configures the app's login item settings (auto-launch on system startup).
     */
    setLoginItemSettings(settings) {
        this._loginItemSettings = { ...this._loginItemSettings, ...settings };
    }
    getLoginItemSettings() {
        return { ...this._loginItemSettings };
    }
    quit() {
        this.emit("before-quit");
        if (typeof globalThis.window_close === "function") {
            globalThis.window_close();
        }
        if (typeof process !== "undefined" && typeof process.exit === "function") {
            process.exit(0);
        }
    }
    exit(code = 0) {
        if (typeof process !== "undefined" && typeof process.exit === "function") {
            process.exit(code);
        }
    }
    relaunch(options = {}) {
        this.quit();
    }
    get isPackaged() {
        return typeof process !== "undefined" && (process.env.NODE_ENV === "production" || !!process.env.PICOTS_PACKAGED);
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    getName() {
        return this._name;
    }
    setName(name) {
        this._name = name;
    }
    getVersion() {
        return this._version;
    }
    setVersion(version) {
        this._version = version;
    }
    getAppPath() {
        return typeof process !== "undefined" ? process.cwd() : "";
    }
    getPath(name) {
        if (typeof process !== "undefined") {
            const home = process.env.USERPROFILE || process.env.HOME || "";
            const appData = process.env.APPDATA || `${home}/AppData/Roaming`;
            const userData = `${appData}/${this._name}`;
            switch (name) {
                case "home": return home;
                case "appData": return appData;
                case "userData": return userData;
                case "temp": return process.env.TEMP || `${home}/AppData/Local/Temp`;
                case "desktop": return `${home}/Desktop`;
                case "documents": return `${home}/Documents`;
                case "downloads": return `${home}/Downloads`;
                case "logs": return `${userData}/logs`;
                case "sessionData": return `${userData}/sessionData`;
                case "exe": return process.cwd();
            }
        }
        return "";
    }
    async getSystemInfo() {
        if (typeof globalThis.get_system_info === "function") {
            const raw = await globalThis.get_system_info();
            return typeof raw === "string" ? JSON.parse(raw) : raw;
        }
        return null;
    }
    async benchmark() {
        if (typeof globalThis.benchmark === "function") {
            await globalThis.benchmark();
            return true;
        }
        return false;
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
                    console.error(`Error in app listener for "${event}":`, err);
                }
            }
        }
    }
}
export const app = new AppEventEmitter();
