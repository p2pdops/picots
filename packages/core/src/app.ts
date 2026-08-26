export interface SystemInfo {
  name: string;
  os: string;
  arch: string;
  cwd: string;
  pid: number;
  isScriptcNative: boolean;
  features: string[];
}

export const app = {
  async getSystemInfo(): Promise<SystemInfo | null> {
    if (typeof (globalThis as any).get_system_info === "function") {
      const raw = await (globalThis as any).get_system_info();
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  },

  async benchmark(): Promise<boolean> {
    if (typeof (globalThis as any).benchmark === "function") {
      await (globalThis as any).benchmark();
      return true;
    }
    return false;
  },
};
