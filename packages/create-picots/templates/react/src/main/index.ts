import { app, BrowserWindow, ipcMain, dialog, clipboard, shell, notification, tray } from "@picots/core";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  mainWindow = new BrowserWindow({
    title: "PicoTS React Desktop",
    width: 1200,
    height: 800,
    frameless: true,
  });

  // Custom Main Process IPC Handlers (Just like Electron's ipcMain.handle)
  ipcMain.handle("get-user-profile", async (event, userId: string) => {
    return {
      id: userId || "usr_dev_01",
      name: "PicoTS Engineer",
      role: "Lead Systems Architect",
      stack: "100% TypeScript + ScriptC Native AOT",
      openPorts: 0,
      binarySize: "446 KB",
      memoryUsageMb: 18.5,
    };
  });

  ipcMain.handle("compute-hash", async (event, input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return { input, hash: "0x" + Math.abs(hash).toString(16).padStart(8, "0") };
  });

  ipcMain.handle("show-open-dialog", async () => {
    return await dialog.showOpenDialog(mainWindow, {
      title: "Select Document",
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
  });

  ipcMain.handle("show-alert", async (event, title: string, message: string) => {
    return await dialog.showMessageBox(mainWindow, {
      title: title || "PicoTS Main Process",
      message: message || "Hello from main/index.ts!",
    });
  });
});
