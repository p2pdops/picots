export interface TrayMenuItem {
  id?: string;
  label: string;
  enabled?: boolean;
}

export interface TrayOptions {
  tooltip?: string;
  menu?: TrayMenuItem[];
}

export const tray = {
  /**
   * Initializes the native system tray icon in the Windows notification area.
   */
  async create(options?: TrayOptions): Promise<boolean> {
    if (typeof (globalThis as any).tray_create === "function") {
      const tooltip = options?.tooltip || "PicoTS Desktop";
      await (globalThis as any).tray_create(tooltip);
      return true;
    }
    return false;
  },

  /**
   * Sets the tooltip text shown when hovering over the tray icon.
   */
  async setTooltip(tooltip: string): Promise<boolean> {
    if (typeof (globalThis as any).tray_set_tooltip === "function") {
      await (globalThis as any).tray_set_tooltip(tooltip);
      return true;
    }
    return false;
  },

  /**
   * Removes the tray icon from the system tray.
   */
  async destroy(): Promise<boolean> {
    if (typeof (globalThis as any).tray_destroy === "function") {
      await (globalThis as any).tray_destroy();
      return true;
    }
    return false;
  },
};
