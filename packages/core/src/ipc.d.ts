export interface IpcMainInvokeEvent {
    sender: any;
    channel: string;
}
export type IpcMainHandler = (event: IpcMainInvokeEvent, ...args: any[]) => any | Promise<any>;
export type IpcRendererListener = (event: any, ...args: any[]) => void;
declare global {
    interface Window {
        ipcRenderer?: IpcRendererManager;
    }
}
export declare class IpcMainManager {
    private _handlers;
    private _listeners;
    private _logging;
    constructor();
    /**
     * Enable or disable IPC call logging in the main process.
     */
    setLogging(enabled: boolean): void;
    isLoggingEnabled(): boolean;
    private _startDevBridge;
    /**
     * Handles an asynchronous IPC call from `ipcRenderer.invoke(channel, ...args)`.
     */
    handle(channel: string, listener: IpcMainHandler): void;
    /**
     * Handles a single invocation then removes itself.
     */
    handleOnce(channel: string, listener: IpcMainHandler): void;
    removeHandler(channel: string): void;
    on(channel: string, listener: Function): void;
    removeListener(channel: string, listener: Function): void;
    once(channel: string, listener: Function): void;
    removeAllListeners(channel?: string): void;
    emit(channel: string, ...args: any[]): void;
    hasHandler(channel: string): boolean;
    /**
     * Internal dispatcher called by native COM IPC bridge.
     */
    _dispatch(channel: string, ...args: any[]): Promise<any>;
}
export declare class IpcRendererManager {
    private _listeners;
    private _logging;
    constructor();
    /**
     * Enable or disable IPC call logging in the renderer process.
     */
    setLogging(enabled: boolean): void;
    isLoggingEnabled(): boolean;
    /**
     * Invokes a registered `ipcMain.handle(channel)` on the native backend.
     * Transports over zero-HTTP direct in-memory COM dispatch.
     */
    invoke(channel: string, ...args: any[]): Promise<any>;
    /**
     * Sends an asynchronous message to the main process.
     */
    send(channel: string, ...args: any[]): void;
    on(channel: string, listener: IpcRendererListener): this;
    once(channel: string, listener: IpcRendererListener): this;
    removeListener(channel: string, listener: IpcRendererListener): this;
    removeAllListeners(channel?: string): this;
}
export declare const ipcMain: IpcMainManager;
export declare const ipcRenderer: IpcRendererManager;
//# sourceMappingURL=ipc.d.ts.map