export const shell = {
    async openExternal(url) {
        if (typeof globalThis.shell_open_external === "function") {
            await globalThis.shell_open_external(url);
            return true;
        }
        window.open(url, "_blank");
        return true;
    },
    async openPath(path) {
        if (typeof globalThis.shell_open_external === "function") {
            await globalThis.shell_open_external(path);
            return "";
        }
        return "";
    },
    beep() {
        // OS system sound
    },
};
