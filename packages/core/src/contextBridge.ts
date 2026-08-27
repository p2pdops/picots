export interface ContextBridge {
  exposeInMainWorld(apiKey: string, api: any): void;
}

export const contextBridge: ContextBridge = {
  /**
   * Exposes an API object onto the window object in the main world.
   * Matching Electron's `contextBridge.exposeInMainWorld(apiKey, api)`.
   * @param apiKey The key on `window` (e.g. "api", "electronAPI", "dhandhaAPI")
   * @param api The API object or methods to expose
   */
  exposeInMainWorld(apiKey: string, api: any): void {
    if (typeof window !== "undefined") {
      (window as any)[apiKey] = api;
    }
  },
};

export default contextBridge;
