export interface OpenFileDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  defaultPath?: string;
}

export interface OpenFileDialogResult {
  canceled: boolean;
  path: string;
}

export const dialog = {
  async openFile(options?: OpenFileDialogOptions): Promise<OpenFileDialogResult> {
    if (typeof (globalThis as any).open_file_dialog === "function") {
      const raw = await (globalThis as any).open_file_dialog();
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && parsed.path) {
        return { canceled: false, path: parsed.path };
      }
    }
    return { canceled: true, path: "" };
  },

  async showMessage(title: string, message: string): Promise<void> {
    if (typeof (globalThis as any).show_message_dialog === "function") {
      await (globalThis as any).show_message_dialog(title, message);
    }
  },
};
