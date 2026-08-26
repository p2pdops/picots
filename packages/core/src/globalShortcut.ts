export class GlobalShortcutManager {
  private _shortcuts: Map<string, () => void> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      (window as any).__picots_hotkey_trigger = (accelerator: string) => {
        this._trigger(accelerator);
      };
    }
  }

  /**
   * Registers a global keyboard shortcut with the operating system.
   * @param accelerator Keyboard shortcut string (e.g. "CommandOrControl+Shift+K", "F11", "Alt+X")
   * @param callback Function to invoke when the hotkey is triggered
   */
  register(accelerator: string, callback: () => void): boolean {
    const normalized = accelerator.trim();
    this._shortcuts.set(normalized, callback);

    if (typeof (globalThis as any).global_shortcut_register === "function") {
      (globalThis as any).global_shortcut_register(normalized);
    }
    return true;
  }

  /**
   * Checks whether a global shortcut is currently registered.
   */
  isRegistered(accelerator: string): boolean {
    return this._shortcuts.has(accelerator.trim());
  }

  /**
   * Unregisters a specific global shortcut.
   */
  unregister(accelerator: string): void {
    const normalized = accelerator.trim();
    this._shortcuts.delete(normalized);
    if (typeof (globalThis as any).global_shortcut_unregister === "function") {
      (globalThis as any).global_shortcut_unregister(normalized);
    }
  }

  /**
   * Unregisters all global shortcuts registered by this application.
   */
  unregisterAll(): void {
    this._shortcuts.clear();
  }

  /**
   * Internal trigger called by Win32 WM_HOTKEY handler.
   */
  _trigger(accelerator: string): void {
    const cb = this._shortcuts.get(accelerator.trim());
    if (cb) {
      try {
        cb();
      } catch (err) {
        console.error(`Error in globalShortcut callback for "${accelerator}":`, err);
      }
    }
  }
}

export const globalShortcut = new GlobalShortcutManager();
