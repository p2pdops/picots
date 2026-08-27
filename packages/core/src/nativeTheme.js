export class NativeThemeManager {
    _themeSource = "system";
    _listeners = [];
    constructor() {
        if (typeof window !== "undefined" && window.matchMedia) {
            const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
            darkModeQuery.addEventListener("change", () => {
                this.emitUpdated();
            });
        }
    }
    /**
     * Whether the OS is currently in dark mode.
     */
    get shouldUseDarkColors() {
        if (this._themeSource === "dark")
            return true;
        if (this._themeSource === "light")
            return false;
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    }
    /**
     * Overrides the theme source ('system', 'light', or 'dark').
     */
    get themeSource() {
        return this._themeSource;
    }
    set themeSource(source) {
        if (this._themeSource !== source) {
            this._themeSource = source;
            this.emitUpdated();
        }
    }
    get shouldUseHighContrastColors() {
        return false;
    }
    get shouldUseInvertedColorScheme() {
        return false;
    }
    on(event, listener) {
        this._listeners.push(listener);
        return this;
    }
    removeListener(event, listener) {
        this._listeners = this._listeners.filter((l) => l !== listener);
        return this;
    }
    emitUpdated() {
        for (const listener of this._listeners) {
            try {
                listener();
            }
            catch (err) {
                console.error("Error in nativeTheme 'updated' listener:", err);
            }
        }
    }
}
export const nativeTheme = new NativeThemeManager();
