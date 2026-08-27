export declare class GlobalShortcutManager {
    private _shortcuts;
    constructor();
    /**
     * Registers a global keyboard shortcut with the operating system.
     * @param accelerator Keyboard shortcut string (e.g. "CommandOrControl+Shift+K", "F11", "Alt+X")
     * @param callback Function to invoke when the hotkey is triggered
     */
    register(accelerator: string, callback: () => void): boolean;
    /**
     * Checks whether a global shortcut is currently registered.
     */
    isRegistered(accelerator: string): boolean;
    /**
     * Unregisters a specific global shortcut.
     */
    unregister(accelerator: string): void;
    /**
     * Unregisters all global shortcuts registered by this application.
     */
    unregisterAll(): void;
    /**
     * Internal trigger called by Win32 WM_HOTKEY handler.
     */
    _trigger(accelerator: string): void;
}
export declare const globalShortcut: GlobalShortcutManager;
//# sourceMappingURL=globalShortcut.d.ts.map