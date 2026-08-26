export type ThemeSource = "system" | "light" | "dark";

export class NativeThemeManager {
  private _themeSource: ThemeSource = "system";
  private _listeners: Function[] = [];

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
  get shouldUseDarkColors(): boolean {
    if (this._themeSource === "dark") return true;
    if (this._themeSource === "light") return false;
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }

  /**
   * Overrides the theme source ('system', 'light', or 'dark').
   */
  get themeSource(): ThemeSource {
    return this._themeSource;
  }

  set themeSource(source: ThemeSource) {
    if (this._themeSource !== source) {
      this._themeSource = source;
      this.emitUpdated();
    }
  }

  get shouldUseHighContrastColors(): boolean {
    return false;
  }

  get shouldUseInvertedColorScheme(): boolean {
    return false;
  }

  on(event: "updated", listener: () => void): this {
    this._listeners.push(listener);
    return this;
  }

  removeListener(event: "updated", listener: () => void): this {
    this._listeners = this._listeners.filter((l) => l !== listener);
    return this;
  }

  private emitUpdated() {
    for (const listener of this._listeners) {
      try {
        listener();
      } catch (err) {
        console.error("Error in nativeTheme 'updated' listener:", err);
      }
    }
  }
}

export const nativeTheme = new NativeThemeManager();
