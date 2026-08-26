export const shell = {
  async openExternal(url: string): Promise<boolean> {
    if (typeof (globalThis as any).shell_open_external === "function") {
      await (globalThis as any).shell_open_external(url);
      return true;
    }
    window.open(url, "_blank");
    return true;
  },

  async openPath(path: string): Promise<string> {
    if (typeof (globalThis as any).shell_open_external === "function") {
      await (globalThis as any).shell_open_external(path);
      return "";
    }
    return "";
  },

  beep(): void {
    // OS system sound
  },
};
