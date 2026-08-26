export const shell = {
  async openExternal(url: string): Promise<boolean> {
    if (typeof (globalThis as any).shell_open_external === "function") {
      await (globalThis as any).shell_open_external(url);
      return true;
    }
    window.open(url, "_blank");
    return true;
  },

  async showItemInFolder(path: string): Promise<boolean> {
    if (typeof (globalThis as any).shell_show_in_folder === "function") {
      await (globalThis as any).shell_show_in_folder(path);
      return true;
    }
    return false;
  },
};
