export * from "./app";
export * from "./window";
export * from "./dialog";
export * from "./fs";
export * from "./clipboard";
export * from "./shell";
export * from "./notification";
export * from "./config";

import { app } from "./app";
import { Window } from "./window";
import { dialog } from "./dialog";
import { fs } from "./fs";
import { clipboard } from "./clipboard";
import { shell } from "./shell";
import { notification } from "./notification";
import { defineConfig } from "./config";

export const picots = {
  app,
  Window,
  dialog,
  fs,
  clipboard,
  shell,
  notification,
  defineConfig,
};

export default picots;
