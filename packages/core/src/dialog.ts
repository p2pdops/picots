export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: ("openFile" | "openDirectory" | "multiSelections" | "showHiddenFiles")[];
}

export interface OpenDialogReturnValue {
  canceled: boolean;
  filePaths: string[];
}

export interface MessageBoxOptions {
  message: string;
  title?: string;
  detail?: string;
  type?: "none" | "info" | "error" | "question" | "warning";
  buttons?: string[];
  defaultId?: number;
}

export interface MessageBoxReturnValue {
  response: number;
  checkboxChecked?: boolean;
}

export const dialog = {
  /**
   * Electron-compatible showOpenDialog
   */
  async showOpenDialog(browserWindowOrOptions?: any, options?: OpenDialogOptions): Promise<OpenDialogReturnValue> {
    const opts: OpenDialogOptions = options || (browserWindowOrOptions && typeof browserWindowOrOptions.title === "string" ? browserWindowOrOptions : {});
    if (typeof (globalThis as any).open_file_dialog === "function") {
      const raw = await (globalThis as any).open_file_dialog();
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && parsed.path) {
        return { canceled: false, filePaths: [parsed.path] };
      }
    }
    return { canceled: true, filePaths: [] };
  },

  /**
   * Convenience alias
   */
  async openFile(options?: OpenDialogOptions): Promise<{ canceled: boolean; path: string }> {
    const res = await this.showOpenDialog(options);
    return { canceled: res.canceled, path: res.filePaths[0] || "" };
  },

  /**
   * Electron-compatible showMessageBox
   */
  async showMessageBox(browserWindowOrOptions?: any, options?: MessageBoxOptions): Promise<MessageBoxReturnValue> {
    const opts: MessageBoxOptions = options || browserWindowOrOptions || { message: "" };
    const title = opts.title || "PicoTS";
    const msg = opts.detail ? `${opts.message}\n\n${opts.detail}` : opts.message;

    if (typeof (globalThis as any).show_message_dialog === "function") {
      await (globalThis as any).show_message_dialog(title, msg);
    }
    return { response: 0 };
  },

  /**
   * Electron-compatible showSaveDialog
   */
  async showSaveDialog(browserWindowOrOptions?: any, options?: any): Promise<{ canceled: boolean; filePath?: string }> {
    const res = await this.showOpenDialog(browserWindowOrOptions, options);
    return { canceled: res.canceled, filePath: res.filePaths[0] };
  },

  /**
   * Electron-compatible showErrorBox
   */
  showErrorBox(title: string, content: string): void {
    if (typeof (globalThis as any).show_message_dialog === "function") {
      (globalThis as any).show_message_dialog(title, content);
    }
  },

  /**
   * Convenience alias
   */
  async showMessage(title: string, message: string): Promise<void> {
    await this.showMessageBox({ title, message });
  },
};
