export * from "./app";
export * from "./window";
export * from "./dialog";
export * from "./fs";
export * from "./config";

// Global window.picots / window.api convenience accessor
import { app } from "./app";
import { Window } from "./window";
import { dialog } from "./dialog";
import { fs } from "./fs";
import { defineConfig } from "./config";

export const picots = {
  app,
  Window,
  dialog,
  fs,
  defineConfig,
};

export default picots;
