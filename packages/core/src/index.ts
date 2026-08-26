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
import { tray, Tray, Menu } from "./tray";
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
  ipcMain,
  ipcRenderer,
  screen,
  globalShortcut,
  nativeTheme,
  protocol,
  Database,
  defineConfig,
};

export default picots;
