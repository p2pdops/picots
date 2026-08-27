export const dialog = {
    /**
     * Electron-compatible showOpenDialog
     */
    async showOpenDialog(browserWindowOrOptions, options) {
        const opts = options || (browserWindowOrOptions && typeof browserWindowOrOptions.title === "string" ? browserWindowOrOptions : {});
        if (typeof globalThis.open_file_dialog === "function") {
            const raw = await globalThis.open_file_dialog();
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
    async openFile(options) {
        const res = await this.showOpenDialog(options);
        return { canceled: res.canceled, path: res.filePaths[0] || "" };
    },
    /**
     * Electron-compatible showMessageBox
     */
    async showMessageBox(browserWindowOrOptions, options) {
        const opts = options || browserWindowOrOptions || { message: "" };
        const title = opts.title || "PicoTS";
        const msg = opts.detail ? `${opts.message}\n\n${opts.detail}` : opts.message;
        if (typeof globalThis.show_message_dialog === "function") {
            await globalThis.show_message_dialog(title, msg);
        }
        return { response: 0 };
    },
    /**
     * Electron-compatible showSaveDialog
     */
    async showSaveDialog(browserWindowOrOptions, options) {
        const res = await this.showOpenDialog(browserWindowOrOptions, options);
        return { canceled: res.canceled, filePath: res.filePaths[0] };
    },
    /**
     * Electron-compatible showErrorBox
     */
    showErrorBox(title, content) {
        if (typeof globalThis.show_message_dialog === "function") {
            globalThis.show_message_dialog(title, content);
        }
    },
    /**
     * Convenience alias
     */
    async showMessage(title, message) {
        await this.showMessageBox({ title, message });
    },
};
