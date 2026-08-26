export * from "./app";
export * from "./window";
export * from "./dialog";
export * from "./fs";
export * from "./clipboard";
export * from "./shell";
export * from "./notification";
export * from "./tray";
export * from "./ipc";
export * from "./config";

import { app } from "./app";
import { BrowserWindow, Window } from "./window";
import { dialog } from "./dialog";
import { fs } from "./fs";
import { clipboard } from "./clipboard";
import { shell } from "./shell";
import { notification } from "./notification";
import { tray, Tray, Menu } from "./tray";
import { ipcMain, ipcRenderer } from "./ipc";
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
  tray,
  Tray,
  Menu,
  ipcMain,
  ipcRenderer,
  defineConfig,
};

export default picots;
