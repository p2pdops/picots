export * from "./app";
export * from "./window";
export * from "./dialog";
export * from "./fs";

// Global window.picots / window.api convenience accessor
import { app } from "./app";
import { Window } from "./window";
import { dialog } from "./dialog";
import { fs } from "./fs";

export const picots = {
  app,
  Window,
  dialog,
  fs,
};

export default picots;
