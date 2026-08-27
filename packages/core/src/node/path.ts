/**
 * PicoTS Node Compatibility Layer: node:path
 * Universal cross-platform path manipulation conforming to Node.js path API.
 */

export const sep = "\\";
export const delimiter = ";";

export function normalize(p: string): string {
  if (!p) return ".";
  let normalized = p.replace(/[\\/]+/g, "\\");
  const isAbs = /^[a-zA-Z]:\\/.test(normalized) || normalized.startsWith("\\\\");
  const parts = normalized.split("\\").filter(Boolean);
  const stack: string[] = [];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop();
      } else if (!isAbs) {
        stack.push("..");
      }
    } else {
      stack.push(part);
    }
  }

  let res = stack.join("\\");
  if (isAbs) {
    const root = normalized.match(/^[a-zA-Z]:\\/)?.[0] || "\\\\";
    res = root + stack.slice(root === "\\\\" ? 0 : 1).join("\\");
  }
  return res || (isAbs ? "\\" : ".");
}

export function join(...paths: string[]): string {
  const filtered = paths.filter((p) => typeof p === "string" && p.trim().length > 0);
  if (filtered.length === 0) return ".";
  return normalize(filtered.join("\\"));
}

export function resolve(...paths: string[]): string {
  let resolved = "";
  for (let i = paths.length - 1; i >= 0; i--) {
    const p = paths[i];
    if (!p) continue;
    resolved = resolved ? `${p}\\${resolved}` : p;
    if (/^[a-zA-Z]:[\\/]/.test(p)) {
      break;
    }
  }
  if (!/^[a-zA-Z]:[\\/]/.test(resolved)) {
    resolved = `C:\\App\\${resolved}`;
  }
  return normalize(resolved);
}

export function basename(p: string, ext?: string): string {
  if (!p) return "";
  const clean = p.replace(/[\\/]+$/, "");
  const lastIndex = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  let base = lastIndex === -1 ? clean : clean.slice(lastIndex + 1);
  if (ext && base.endsWith(ext)) {
    base = base.slice(0, -ext.length);
  }
  return base;
}

export function dirname(p: string): string {
  if (!p) return ".";
  const clean = p.replace(/[\\/]+$/, "");
  const lastIndex = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  if (lastIndex === -1) return ".";
  if (lastIndex === 0) return clean[0];
  return clean.slice(0, lastIndex);
}

export function extname(p: string): string {
  if (!p) return "";
  const base = basename(p);
  const dotIndex = base.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return base.slice(dotIndex);
}

export const win32 = {
  sep: "\\",
  delimiter: ";",
  normalize,
  join,
  resolve,
  basename,
  dirname,
  extname,
};

export const posix = {
  sep: "/",
  delimiter: ":",
  normalize: (p: string) => normalize(p).replace(/\\/g, "/"),
  join: (...paths: string[]) => join(...paths).replace(/\\/g, "/"),
  resolve: (...paths: string[]) => resolve(...paths).replace(/\\/g, "/"),
  basename,
  dirname: (p: string) => dirname(p).replace(/\\/g, "/"),
  extname,
};

export const path = {
  sep,
  delimiter,
  normalize,
  join,
  resolve,
  basename,
  dirname,
  extname,
  win32,
  posix,
};

export default path;
