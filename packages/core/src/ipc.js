/**
 * Format argument preview for clean log output
 */
function formatLogPayload(args) {
    if (!args || args.length === 0)
        return "";
    if (args.length === 1)
        return args[0];
    return args;
}
export class IpcMainManager {
    _handlers = new Map();
    _listeners = new Map();
    _logging = true;
    constructor() {
        globalThis.__picots_ipc_main = this;
        if (typeof process !== "undefined") {
            const isDev = process.env.NODE_ENV === "development" || process.env.PICOTS_DEV === "true" || !!process.env.PICOTS_IPC_PORT;
            this._logging = process.env.PICOTS_IPC_LOGS !== "false";
            if (typeof window === "undefined" && isDev) {
                this._startDevBridge();
            }
        }
    }
    /**
     * Enable or disable IPC call logging in the main process.
     */
    setLogging(enabled) {
        this._logging = enabled;
    }
    isLoggingEnabled() {
        return this._logging;
    }
    async _startDevBridge() {
        const port = parseInt(process.env.PICOTS_IPC_PORT || "5174", 10);
        const self = this;
        try {
            let http = null;
            try {
                if (typeof globalThis.require === "function") {
                    http = globalThis.require("node:http");
                }
                else {
                    http = await import("node:http");
                }
            }
            catch { }
            if (http && typeof http.createServer === "function") {
                const server = http.createServer(async (req, res) => {
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
                        req.on("data", (chunk) => {
                            body += chunk;
                        });
                        req.on("end", async () => {
                            try {
                                const { channel, args } = JSON.parse(body || "{}");
                                const result = await self._dispatch(channel, ...(args || []));
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ result }));
                            }
                            catch (err) {
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
                server.on("error", (err) => {
                    if (err.code !== "EADDRINUSE") {
                        console.warn("⚠️ [PicoTS] Dev IPC Bridge warning:", err.message);
                    }
                });
                server.listen(port, "127.0.0.1", () => {
                    console.log(`📡 [PicoTS] Dev IPC Bridge listening on http://127.0.0.1:${port}/__picots_ipc`);
                });
            }
        }
        catch (err) { }
    }
    /**
     * Handles an asynchronous IPC call from `ipcRenderer.invoke(channel, ...args)`.
     */
    handle(channel, listener) {
        if (this._handlers.has(channel)) {
            throw new Error(`Attempted to register a second handler for '${channel}'`);
        }
        this._handlers.set(channel, listener);
    }
    /**
     * Handles a single invocation then removes itself.
     */
    handleOnce(channel, listener) {
        const onceWrapper = async (event, ...args) => {
            this.removeHandler(channel);
            return await listener(event, ...args);
        };
        this.handle(channel, onceWrapper);
    }
    removeHandler(channel) {
        this._handlers.delete(channel);
    }
    on(channel, listener) {
        if (!this._listeners.has(channel)) {
            this._listeners.set(channel, []);
        }
        this._listeners.get(channel).push(listener);
    }
    removeListener(channel, listener) {
        const list = this._listeners.get(channel);
        if (list) {
            this._listeners.set(channel, list.filter((l) => l !== listener));
        }
    }
    once(channel, listener) {
        const onceWrapper = (...args) => {
            this.removeListener(channel, onceWrapper);
            listener(...args);
        };
        this.on(channel, onceWrapper);
    }
    removeAllListeners(channel) {
        if (channel) {
            this._listeners.delete(channel);
        }
        else {
            this._listeners.clear();
        }
    }
    emit(channel, ...args) {
        if (this._logging) {
            console.log(`\x1b[35m[IPC:Main]\x1b[0m 📢 emit: \x1b[36m${channel}\x1b[0m`, formatLogPayload(args));
        }
        const list = this._listeners.get(channel);
        if (list) {
            for (const listener of list) {
                try {
                    listener({ sender: null, channel }, ...args);
                }
                catch (err) {
                    console.error(`Error in ipcMain listener for "${channel}":`, err);
                }
            }
        }
    }
    hasHandler(channel) {
        return this._handlers.has(channel) || this._listeners.has(channel);
    }
    /**
     * Internal dispatcher called by native COM IPC bridge.
     */
    async _dispatch(channel, ...args) {
        const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
        const handler = this._handlers.get(channel);
        if (handler) {
            if (this._logging) {
                console.log(`\x1b[35m[IPC:Main]\x1b[0m 📥 \x1b[36m${channel}\x1b[0m`, formatLogPayload(args));
            }
            try {
                const event = { sender: null, channel };
                const result = await handler(event, ...args);
                if (this._logging) {
                    const duration = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime).toFixed(2);
                    console.log(`\x1b[35m[IPC:Main]\x1b[0m ✅ \x1b[36m${channel}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m`, result !== undefined ? result : "");
                }
                return result;
            }
            catch (err) {
                if (this._logging) {
                    const duration = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime).toFixed(2);
                    console.error(`\x1b[35m[IPC:Main]\x1b[0m ❌ \x1b[36m${channel}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m:`, err?.message || err);
                }
                throw err;
            }
        }
        const list = this._listeners.get(channel);
        if (list && list.length > 0) {
            if (this._logging) {
                console.log(`\x1b[35m[IPC:Main]\x1b[0m 📥 event: \x1b[36m${channel}\x1b[0m`, formatLogPayload(args));
            }
            for (const listener of list) {
                listener({ channel }, ...args);
            }
            return { status: "ok" };
        }
        if (this._logging) {
            console.warn(`\x1b[35m[IPC:Main]\x1b[0m ⚠️ No handler registered for '${channel}'`);
        }
        throw new Error(`No handler registered for '${channel}' in ipcMain`);
    }
}
export class IpcRendererManager {
    _listeners = new Map();
    _logging = true;
    constructor() {
        if (typeof window !== "undefined") {
            this._logging = window.__PICOTS_IPC_LOGS__ !== false;
            window.__picots_ipc_receive = (channel, ...args) => {
                if (this._logging) {
                    console.log(`%c[IPC:Renderer] 📩 receive: ${channel}`, "color: #ab47bc; font-weight: bold;", formatLogPayload(args));
                }
                const list = this._listeners.get(channel);
                if (list) {
                    for (const listener of list) {
                        listener({ channel }, ...args);
                    }
                }
            };
            // Standard Electron global ipcRenderer
            window.ipcRenderer = window.ipcRenderer || this;
            // Automatic window dragging for elements with .drag-region, -webkit-app-region: drag, or data-picots-drag
            if (typeof document !== "undefined") {
                document.addEventListener("mousedown", (e) => {
                    if (e.button !== 0)
                        return;
                    const target = e.target;
                    if (!target)
                        return;
                    const isNoDrag = target.closest(".no-drag, button, input, textarea, a, select, [data-no-drag]");
                    if (isNoDrag)
                        return;
                    const isDrag = target.closest(".drag-region, [data-picots-drag], [data-tauri-drag-region], [style*='app-region: drag'], [style*='app-region:drag']");
                    if (isDrag) {
                        this.invoke("window_start_drag").catch(() => { });
                    }
                });
            }
        }
    }
    /**
     * Enable or disable IPC call logging in the renderer process.
     */
    setLogging(enabled) {
        this._logging = enabled;
    }
    isLoggingEnabled() {
        return this._logging;
    }
    /**
     * Invokes a registered `ipcMain.handle(channel)` on the native backend.
     * Transports over zero-HTTP direct in-memory COM dispatch.
     */
    async invoke(channel, ...args) {
        const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (this._logging) {
            console.log(`%c[IPC:Renderer] 📤 invoke: ${channel}`, "color: #00bcd4; font-weight: bold;", formatLogPayload(args));
        }
        try {
            let result;
            // 1. Direct native function match if available on window
            const normalizedName = channel.replace(/[^a-zA-Z0-9_]/g, "_");
            if (typeof globalThis[normalizedName] === "function") {
                const raw = await globalThis[normalizedName](...args);
                result = typeof raw === "string" ? JSON.parse(raw) : raw;
            }
            else if (typeof globalThis.invoke === "function") {
                // 2. Generic native invoke dispatcher
                const res = await globalThis.invoke(channel, ...args);
                result = typeof res === "string" ? JSON.parse(res) : res;
            }
            else if (ipcMain && ipcMain.hasHandler(channel)) {
                // 3. In-process direct memory dispatch (Production Standalone & Unified Runtime)
                result = await ipcMain._dispatch(channel, ...args);
            }
            else {
                // 4. Dev Mode cross-process IPC Bridge over HTTP (only when running in Vite browser dev mode)
                const isViteDev = typeof window !== "undefined" &&
                    typeof fetch === "function" &&
                    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
                    window.location.port !== "";
                if (isViteDev) {
                    try {
                        const port = window.__PICOTS_IPC_PORT__ || 5174;
                        const resp = await fetch(`http://127.0.0.1:${port}/__picots_ipc`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ channel, args }),
                        });
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data && data.error)
                                throw new Error(data.error);
                            result = data.result;
                        }
                        else {
                            const errData = await resp.json().catch(() => ({}));
                            throw new Error(errData?.error || `Dev IPC bridge returned ${resp.status}`);
                        }
                    }
                    catch (err) {
                        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
                            throw err;
                        }
                    }
                }
                // 5. Final in-process fallback
                if (result === undefined && ipcMain) {
                    result = await ipcMain._dispatch(channel, ...args);
                }
            }
            if (result === undefined && (!ipcMain || !ipcMain.hasHandler(channel))) {
                throw new Error(`Failed to invoke IPC channel '${channel}': no backend handler active.`);
            }
            if (this._logging) {
                const duration = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime).toFixed(2);
                console.log(`%c[IPC:Renderer] 📥 resolved: ${channel} (${duration}ms)`, "color: #4caf50; font-weight: bold;", result !== undefined ? result : "");
            }
            return result;
        }
        catch (err) {
            if (this._logging) {
                const duration = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime).toFixed(2);
                console.error(`%c[IPC:Renderer] ❌ error: ${channel} (${duration}ms)`, "color: #f44336; font-weight: bold;", err?.message || err);
            }
            throw err;
        }
    }
    /**
     * Sends an asynchronous message to the main process.
     */
    send(channel, ...args) {
        if (this._logging) {
            console.log(`%c[IPC:Renderer] 🚀 send: ${channel}`, "color: #ff9800; font-weight: bold;", formatLogPayload(args));
        }
        this.invoke(channel, ...args).catch(() => { });
    }
    on(channel, listener) {
        if (!this._listeners.has(channel)) {
            this._listeners.set(channel, []);
        }
        this._listeners.get(channel).push(listener);
        return this;
    }
    once(channel, listener) {
        const onceWrapper = (event, ...args) => {
            this.removeListener(channel, onceWrapper);
            listener(event, ...args);
        };
        return this.on(channel, onceWrapper);
    }
    removeListener(channel, listener) {
        const list = this._listeners.get(channel);
        if (list) {
            this._listeners.set(channel, list.filter((l) => l !== listener));
        }
        return this;
    }
    removeAllListeners(channel) {
        if (channel) {
            this._listeners.delete(channel);
        }
        else {
            this._listeners.clear();
        }
        return this;
    }
}
export const ipcMain = new IpcMainManager();
export const ipcRenderer = new IpcRendererManager();
