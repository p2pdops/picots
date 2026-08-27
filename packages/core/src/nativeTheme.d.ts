export type ThemeSource = "system" | "light" | "dark";
export declare class NativeThemeManager {
    private _themeSource;
    private _listeners;
    constructor();
    /**
     * Whether the OS is currently in dark mode.
     */
    get shouldUseDarkColors(): boolean;
    /**
     * Overrides the theme source ('system', 'light', or 'dark').
     */
    get themeSource(): ThemeSource;
    set themeSource(source: ThemeSource);
    get shouldUseHighContrastColors(): boolean;
    get shouldUseInvertedColorScheme(): boolean;
    on(event: "updated", listener: () => void): this;
    removeListener(event: "updated", listener: () => void): this;
    private emitUpdated;
}
export declare const nativeTheme: NativeThemeManager;
//# sourceMappingURL=nativeTheme.d.ts.map