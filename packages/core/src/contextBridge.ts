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
      try {
        Object.defineProperty(window, apiKey, {
          value: api,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        (window as any)[apiKey] = api;
      }
      
      const isLogging = (window as any).__PICOTS_IPC_LOGS__ !== false;
      if (isLogging) {
        console.log(`%c[PicoTS:Preload] 🌉 contextBridge.exposeInMainWorld: "${apiKey}" successfully exposed to window`, "color: #00e5ff; font-weight: bold;");
      }
    }
  },
};

export default contextBridge;

