export interface WindowConfig {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  frameless?: boolean;
  frame?: boolean;
  icon?: string;
}

export interface BuildConfig {
  outDir?: string;
  frontendDir?: string;
  target?: string;
}

export interface DevConfig {
  port?: number;
  url?: string;
}

export interface LoggingConfig {
  /**
   * Enable real-time IPC message logging in console and terminal.
   * @default true in dev mode
   */
  ipc?: boolean;
  /**
   * Forward browser renderer console logs to terminal.
   * @default true
   */
  renderer?: boolean;
}

export interface PicotsConfig {
  name?: string;
  main?: string;
  preload?: string;
  window?: WindowConfig;
  build?: BuildConfig;
  dev?: DevConfig;
  logging?: boolean | LoggingConfig;
}

/**
 * Type helper for defining a type-safe PicoTS configuration
 */
export function defineConfig(config: PicotsConfig): PicotsConfig {
  return config;
}

