export const clipboard = {
  async writeText(text: string): Promise<boolean> {
    if (typeof (globalThis as any).clipboard_write === "function") {
      const res = await (globalThis as any).clipboard_write(text);
      return res === "{\"status\":\"ok\"}" || res?.status === "ok";
    }
    // Fallback to Web Clipboard API if in browser context
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  },

  async readText(): Promise<string> {
    if (typeof (globalThis as any).clipboard_read === "function") {
      const raw = await (globalThis as any).clipboard_read();
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return parsed?.text || "";
    }
    // Fallback to Web Clipboard API if available
    if (navigator?.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
    return "";
  },

  async clear(): Promise<void> {
    await this.writeText("");
  },
};
