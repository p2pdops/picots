/**
 * PicoTS Node Compatibility Layer: node:os
 * Implements standard OS query APIs over the native Win32 C++ host bridge.
 */

export function platform(): string {
  return "win32";
}

export function arch(): string {
  return "x64";
}

export function homedir(): string {
  if (typeof (globalThis as any).__picots_os_homedir === "function") {
    const res = (globalThis as any).__picots_os_homedir();
    if (typeof res === "string" && res.length > 0) return res;
  }
  return "C:\\Users\\User";
}

export function tmpdir(): string {
  if (typeof (globalThis as any).__picots_os_tmpdir === "function") {
    const res = (globalThis as any).__picots_os_tmpdir();
    if (typeof res === "string" && res.length > 0) return res;
  }
  return "C:\\Windows\\Temp";
}

export function totalmem(): number {
  if (typeof (globalThis as any).__picots_os_totalmem === "function") {
    const res = (globalThis as any).__picots_os_totalmem();
    const num = Number(res);
    if (!isNaN(num) && num > 0) return num;
  }
  return 17179869184; // 16 GB default
}

export function freemem(): number {
  if (typeof (globalThis as any).__picots_os_freemem === "function") {
    const res = (globalThis as any).__picots_os_freemem();
    const num = Number(res);
    if (!isNaN(num) && num > 0) return num;
  }
  return 8589934592; // 8 GB default
}

export function cpus(): Array<{ model: string; speed: number }> {
  if (typeof (globalThis as any).__picots_os_cpus === "function") {
    try {
      const res = (globalThis as any).__picots_os_cpus();
      const parsed = typeof res === "string" ? JSON.parse(res) : res;
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return Array.from({ length: 8 }, () => ({
    model: "x64 Native Processor",
    speed: 3200,
  }));
}

export function hostname(): string {
  if (typeof (globalThis as any).__picots_os_hostname === "function") {
    const res = (globalThis as any).__picots_os_hostname();
    if (typeof res === "string" && res.length > 0) return res;
  }
  return "DESKTOP-APP";
}

export function type(): string {
  return "Windows_NT";
}

export function release(): string {
  return "10.0.22631";
}

export function userInfo(): { username: string; homedir: string; shell: null } {
  return {
    username: "User",
    homedir: homedir(),
    shell: null,
  };
}

export const os = {
  platform,
  arch,
  homedir,
  tmpdir,
  totalmem,
  freemem,
  cpus,
  hostname,
  type,
  release,
  userInfo,
};

export default os;
