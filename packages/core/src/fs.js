export const fs = {
    async listFiles(dir = "") {
        if (typeof globalThis.list_files === "function") {
            const raw = await globalThis.list_files(dir);
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return parsed || { dir: "", items: [] };
        }
        return { dir: "", items: [] };
    },
};
