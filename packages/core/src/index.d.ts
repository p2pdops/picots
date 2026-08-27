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
export * from "./contextBridge";
export * from "./config";
import { app } from "./app";
import { BrowserWindow } from "./window";
import { dialog } from "./dialog";
import { clipboard } from "./clipboard";
import { shell } from "./shell";
import { Notification } from "./notification";
import { Tray, Menu, MenuItem } from "./tray";
import { Database } from "./sqlite";
import { defineConfig } from "./config";
export declare const picots: {
    app: import("./app").AppEventEmitter;
    BrowserWindow: typeof BrowserWindow;
    Window: typeof BrowserWindow;
    dialog: {
        showOpenDialog(browserWindowOrOptions?: any, options?: import("./dialog").OpenDialogOptions): Promise<import("./dialog").OpenDialogReturnValue>;
        openFile(options?: import("./dialog").OpenDialogOptions): Promise<{
            canceled: boolean;
            path: string;
        }>;
        showMessageBox(browserWindowOrOptions?: any, options?: import("./dialog").MessageBoxOptions): Promise<import("./dialog").MessageBoxReturnValue>;
        showSaveDialog(browserWindowOrOptions?: any, options?: any): Promise<{
            canceled: boolean;
            filePath?: string;
        }>;
        showErrorBox(title: string, content: string): void;
        showMessage(title: string, message: string): Promise<void>;
    };
    fs: {
        listFiles(dir?: string): Promise<import("./fs").ListFilesResult>;
    };
    clipboard: {
        writeText(text: string): Promise<boolean>;
        readText(): Promise<string>;
        clear(): Promise<void>;
    };
    shell: {
        openExternal(url: string): Promise<boolean>;
        openPath(path: string): Promise<string>;
        beep(): void;
    };
    notification: {
        send(options: import("./notification").NotificationOptions): Promise<boolean>;
    };
    Notification: typeof Notification;
    tray: {
        create: (options?: {
            tooltip?: string;
        }) => Promise<boolean>;
        setTooltip: (tooltip: string) => Promise<boolean>;
        destroy: () => Promise<boolean>;
    };
    Tray: typeof Tray;
    Menu: typeof Menu;
    MenuItem: typeof MenuItem;
    ipcMain: import("./ipc").IpcMainManager;
    ipcRenderer: import("./ipc").IpcRendererManager;
    contextBridge: import("./contextBridge").ContextBridge;
    screen: import("./screen").ScreenManager;
    globalShortcut: import("./globalShortcut").GlobalShortcutManager;
    nativeTheme: import("./nativeTheme").NativeThemeManager;
    protocol: import("./protocol").ProtocolManager;
    Database: typeof Database;
    defineConfig: typeof defineConfig;
};
declare global {
    namespace NodeJS {
        interface Process {
            resourcesPath: string;
        }
    }
    namespace Electron {
        type IpcMainInvokeEvent = import("./ipc").IpcMainInvokeEvent;
        type IpcMainEvent = import("./ipc").IpcMainInvokeEvent;
        type IpcRendererEvent = any;
        type IpcRendererListener = import("./ipc").IpcRendererListener;
        type BrowserWindow = import("./window").BrowserWindow;
        type BrowserWindowConstructorOptions = import("./window").BrowserWindowConstructorOptions;
        type WebPreferences = import("./window").WebPreferences;
        type PrintToPDFOptions = import("./window").PrintToPDFOptions;
        type PrintOptions = import("./window").PrintOptions;
        type MenuItem = import("./tray").MenuItem;
        type Menu = import("./tray").Menu;
        type Tray = import("./tray").Tray;
        type App = typeof app;
        type Dialog = typeof dialog;
        type Shell = typeof shell;
        type Clipboard = typeof clipboard;
        const contextBridge: typeof import("./index").contextBridge;
    }
}
export default picots;
//# sourceMappingURL=index.d.ts.map