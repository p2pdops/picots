export * from "./app";
export * from "./window";
export * from "./dialog";
export * from "./fs";
export * from "./clipboard";
export * from "./shell";
export * from "./notification";
export * from "./tray";
export * from "./ipc";
export * from "./logger";
export * from "./screen";
export * from "./globalShortcut";
export * from "./nativeTheme";
export * from "./protocol";
export * from "./sqlite";
export * from "./config";

import { app } from "./app";
import { BrowserWindow, Window } from "./window";
import { dialog } from "./dialog";
import { fs } from "./fs";
import { clipboard } from "./clipboard";
import { shell } from "./shell";
import { notification, Notification } from "./notification";
import { tray, Tray, Menu, MenuItem } from "./tray";
import { ipcMain, ipcRenderer } from "./ipc";
import { screen } from "./screen";
import { globalShortcut } from "./globalShortcut";
import { nativeTheme } from "./nativeTheme";
import { protocol } from "./protocol";
import { Database } from "./sqlite";
import { defineConfig } from "./config";

export const picots = {
  app,
  BrowserWindow,
  Window,
  dialog,
  fs,
  clipboard,
  shell,
  notification,
  Notification,
  tray,
  Tray,
  Menu,
  MenuItem,
  ipcMain,
  ipcRenderer,
  screen,
  globalShortcut,
  nativeTheme,
  protocol,
  Database,
  defineConfig,
};

// Polyfill process.resourcesPath if missing
if (typeof process !== "undefined" && !(process as any).resourcesPath) {
  (process as any).resourcesPath = process.cwd();
}

// Global Electron namespace for 100% drop-in TypeScript compatibility
declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath?: string;
    }
  }

  namespace Electron {
    export type IpcMainInvokeEvent = import("./ipc").IpcMainInvokeEvent;
    export type IpcMainEvent = import("./ipc").IpcMainInvokeEvent;
    export type IpcRendererEvent = any;
    export type IpcRendererListener = import("./ipc").IpcRendererListener;
    export type BrowserWindow = import("./window").BrowserWindow;
    export type BrowserWindowConstructorOptions = import("./window").BrowserWindowConstructorOptions;
    export type WebPreferences = import("./window").WebPreferences;
    export type PrintToPDFOptions = import("./window").PrintToPDFOptions;
    export type PrintOptions = import("./window").PrintOptions;
    export type MenuItem = import("./tray").MenuItem;
    export type Menu = import("./tray").Menu;
    export type Tray = import("./tray").Tray;
    export type App = typeof app;
    export type Dialog = typeof dialog;
    export type Shell = typeof shell;
    export type Clipboard = typeof clipboard;
  }
}

export default picots;
