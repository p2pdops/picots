export interface SystemInfo {
    name: string;
    os: string;
    arch: string;
    cwd: string;
    pid: number;
    isScriptcNative: boolean;
    features: string[];
}
export type AppPathName = "home" | "appData" | "userData" | "temp" | "desktop" | "documents" | "downloads" | "exe";
export interface LoginItemSettings {
    openAtLogin: boolean;
    openAsHidden?: boolean;
    path?: string;
    args?: string[];
}
export declare class AppEventEmitter {
    private _listeners;
    private _isReady;
    private _name;
    private _version;
    private _hasSingleInstanceLock;
    private _loginItemSettings;
    private _protocolClients;
    constructor();
    /**
     * Resolves when the PicoTS application lifecycle is ready.
     */
    whenReady(): Promise<void>;
    isReady(): boolean;
    /**
     * Makes the application a Single Instance Application.
     * Returns true if this instance obtained the lock.
     */
    requestSingleInstanceLock(): boolean;
    hasSingleInstanceLock(): boolean;
    releaseSingleInstanceLock(): void;
    /**
     * Sets the current executable as the default handler for a custom protocol (e.g. "myapp://").
     */
    setAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean;
    isDefaultProtocolClient(protocol: string): boolean;
    removeAsDefaultProtocolClient(protocol: string): boolean;
    /**
     * Configures the app's login item settings (auto-launch on system startup).
     */
    setLoginItemSettings(settings: LoginItemSettings): void;
    getLoginItemSettings(): LoginItemSettings;
    quit(): void;
    exit(code?: number): void;
    relaunch(options?: {
        args?: string[];
        execPath?: string;
    }): void;
    get isPackaged(): boolean;
    get name(): string;
    set name(value: string);
    getName(): string;
    setName(name: string): void;
    getVersion(): string;
    setVersion(version: string): void;
    getAppPath(): string;
    getPath(name: string): string;
    getSystemInfo(): Promise<SystemInfo | null>;
    benchmark(): Promise<boolean>;
    on(event: string, listener: Function): this;
    once(event: string, listener: Function): this;
    removeListener(event: string, listener: Function): this;
    private emit;
}
export declare const app: AppEventEmitter;
//# sourceMappingURL=app.d.ts.map