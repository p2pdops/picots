import { ipcMain } from "@picots/core";
import * as readline from "node:readline";
import "./src/main/index.ts";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

(rl as any).on("line", async (line: string) => {
  if (!line || !line.trim()) return;
  try {
    const req = JSON.parse(line);
    const a = req.args || [];
    const res = await ipcMain._dispatch(req.channel, a[0], a[1], a[2], a[3]);
    const out: Record<string, any> = { __picots_result: res !== undefined ? res : null };
    console.log(JSON.stringify(out));
  } catch (err) {
    const outErr: Record<string, any> = { __picots_error: String(err) };
    console.log(JSON.stringify(outErr));
  }
});
