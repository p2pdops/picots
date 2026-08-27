/**
 * PicoTS Node Compatibility Layer: node:fs
 * Implements synchronous and asynchronous filesystem operations over the Win32 C++ host bridge.
 */

// In-memory fallback cache when running in pure browser previews
const MEM_FS = new Map<string, string>();

export function writeFileSync(filePath: string, data: any, options?: any): void {
  const content = typeof data === "string" ? data : JSON.stringify(data);
  MEM_FS.set(filePath, content);

  if (typeof (globalThis as any).__picots_fs_write === "function") {
    (globalThis as any).__picots_fs_write(filePath, content);
  }
}

export function readFileSync(filePath: string, options?: any): string {
  if (typeof (globalThis as any).__picots_fs_read === "function") {
    const res = (globalThis as any).__picots_fs_read(filePath);
    if (typeof res === "string" && res.length > 0) return res;
  }
  if (MEM_FS.has(filePath)) {
    return MEM_FS.get(filePath)!;
  }
  return "";
}

export function existsSync(filePath: string): boolean {
  if (typeof (globalThis as any).__picots_fs_exists === "function") {
    const res = (globalThis as any).__picots_fs_exists(filePath);
    return res === true || res === "true";
  }
  return MEM_FS.has(filePath);
}

export function unlinkSync(filePath: string): void {
  MEM_FS.delete(filePath);
  if (typeof (globalThis as any).__picots_fs_unlink === "function") {
    (globalThis as any).__picots_fs_unlink(filePath);
  }
}

export function mkdirSync(dirPath: string, options?: any): void {
  if (typeof (globalThis as any).__picots_fs_mkdir === "function") {
    (globalThis as any).__picots_fs_mkdir(dirPath);
  }
}

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
}

export interface ListFilesResult {
  dir: string;
  items: FileEntry[];
}

export async function listFiles(dir: string = ""): Promise<ListFilesResult> {
  if (typeof (globalThis as any).list_files === "function") {
    const raw = await (globalThis as any).list_files(dir);
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed || { dir: "", items: [] };
  }
  return { dir: "", items: [] };
}

export const promises = {
  writeFile: async (p: string, d: any, opt?: any) => writeFileSync(p, d, opt),
  readFile: async (p: string, opt?: any) => readFileSync(p, opt),
  unlink: async (p: string) => unlinkSync(p),
  mkdir: async (p: string, opt?: any) => mkdirSync(p, opt),
  listFiles,
};

export const fs = {
  writeFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
  mkdirSync,
  listFiles,
  promises,
};

export default fs;
