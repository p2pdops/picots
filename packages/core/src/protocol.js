export class ProtocolManager {
    _schemes = new Map();
    _handlers = new Map();
    /**
     * Registers a custom protocol handler matching Electron's modern `protocol.handle(scheme, handler)` API.
     * @param scheme The custom protocol name (e.g. "app", "picots", "asset")
     * @param handler A standard Fetch Request/Response handler
     */
    handle(scheme, handler) {
        const clean = scheme.replace(/:\/\/$/, "");
        this._handlers.set(clean, handler);
    }
    unhandle(scheme) {
        const clean = scheme.replace(/:\/\/$/, "");
        this._handlers.delete(clean);
    }
    isProtocolHandled(scheme) {
        const clean = scheme.replace(/:\/\/$/, "");
        return this._handlers.has(clean);
    }
    registerFileProtocol(scheme, handler) {
        const clean = scheme.replace(/:\/\/$/, "");
        this._schemes.set(clean, handler);
        return true;
    }
    registerBufferProtocol(scheme, handler) {
        const clean = scheme.replace(/:\/\/$/, "");
        this._schemes.set(clean, handler);
        return true;
    }
    registerStringProtocol(scheme, handler) {
        const clean = scheme.replace(/:\/\/$/, "");
        this._schemes.set(clean, handler);
        return true;
    }
    unregisterProtocol(scheme) {
        const clean = scheme.replace(/:\/\/$/, "");
        return this._schemes.delete(clean);
    }
    isProtocolRegistered(scheme) {
        const clean = scheme.replace(/:\/\/$/, "");
        return this._schemes.has(clean) || this._handlers.has(clean);
    }
}
export const protocol = new ProtocolManager();
