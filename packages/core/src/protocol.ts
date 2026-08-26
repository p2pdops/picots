export interface ProtocolRequest {
  url: string;
  referrer: string;
  method: string;
  uploadData?: any[];
  headers: Record<string, string>;
}

export type ProtocolResponse = Response | Promise<Response>;
export type ProtocolHandler = (request: Request) => ProtocolResponse;

export class ProtocolManager {
  private _schemes: Map<string, Function> = new Map();
  private _handlers: Map<string, ProtocolHandler> = new Map();

  /**
   * Registers a custom protocol handler matching Electron's modern `protocol.handle(scheme, handler)` API.
   * @param scheme The custom protocol name (e.g. "app", "picots", "asset")
   * @param handler A standard Fetch Request/Response handler
   */
  handle(scheme: string, handler: ProtocolHandler): void {
    const clean = scheme.replace(/:\/\/$/, "");
    this._handlers.set(clean, handler);
  }

  unhandle(scheme: string): void {
    const clean = scheme.replace(/:\/\/$/, "");
    this._handlers.delete(clean);
  }

  isProtocolHandled(scheme: string): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    return this._handlers.has(clean);
  }

  registerFileProtocol(
    scheme: string,
    handler: (request: ProtocolRequest, callback: (response: { path: string } | string) => void) => void
  ): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    this._schemes.set(clean, handler);
    return true;
  }

  registerBufferProtocol(
    scheme: string,
    handler: (request: ProtocolRequest, callback: (response: { mimeType?: string; data: Buffer | Uint8Array }) => void) => void
  ): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    this._schemes.set(clean, handler);
    return true;
  }

  registerStringProtocol(
    scheme: string,
    handler: (request: ProtocolRequest, callback: (response: { mimeType?: string; data: string } | string) => void) => void
  ): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    this._schemes.set(clean, handler);
    return true;
  }

  unregisterProtocol(scheme: string): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    return this._schemes.delete(clean);
  }

  isProtocolRegistered(scheme: string): boolean {
    const clean = scheme.replace(/:\/\/$/, "");
    return this._schemes.has(clean) || this._handlers.has(clean);
  }
}

export const protocol = new ProtocolManager();
