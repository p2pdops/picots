export interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
}

export interface ListFilesResult {
  dir: string;
  items: FileEntry[];
}

export const fs = {
  async listFiles(dir: string = ""): Promise<ListFilesResult> {
    if (typeof (globalThis as any).list_files === "function") {
      const raw = await (globalThis as any).list_files(dir);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return parsed || { dir: "", items: [] };
    }
    return { dir: "", items: [] };
  },
};
