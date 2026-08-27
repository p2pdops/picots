export interface ProtocolRequest {
    url: string;
    referrer: string;
    method: string;
    uploadData?: any[];
    headers: Record<string, string>;
}
export type ProtocolResponse = Response | Promise<Response>;
export type ProtocolHandler = (request: Request) => ProtocolResponse;
export declare class ProtocolManager {
    private _schemes;
    private _handlers;
    /**
     * Registers a custom protocol handler matching Electron's modern `protocol.handle(scheme, handler)` API.
     * @param scheme The custom protocol name (e.g. "app", "picots", "asset")
     * @param handler A standard Fetch Request/Response handler
     */
    handle(scheme: string, handler: ProtocolHandler): void;
    unhandle(scheme: string): void;
    isProtocolHandled(scheme: string): boolean;
    registerFileProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: {
        path: string;
    } | string) => void) => void): boolean;
    registerBufferProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: {
        mimeType?: string;
        data: Buffer | Uint8Array;
    }) => void) => void): boolean;
    registerStringProtocol(scheme: string, handler: (request: ProtocolRequest, callback: (response: {
        mimeType?: string;
        data: string;
    } | string) => void) => void): boolean;
    unregisterProtocol(scheme: string): boolean;
    isProtocolRegistered(scheme: string): boolean;
}
export declare const protocol: ProtocolManager;
//# sourceMappingURL=protocol.d.ts.map