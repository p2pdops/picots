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

export interface PicotsConfig {
  name?: string;
  main?: string;
  window?: WindowConfig;
  build?: BuildConfig;
  dev?: DevConfig;
}

/**
 * Type helper for defining a type-safe PicoTS configuration
 */
export function defineConfig(config: PicotsConfig): PicotsConfig {
  return config;
}
