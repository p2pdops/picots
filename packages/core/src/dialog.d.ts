export interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: {
        name: string;
        extensions: string[];
    }[];
    properties?: ("openFile" | "openDirectory" | "multiSelections" | "showHiddenFiles")[];
}
export interface OpenDialogReturnValue {
    canceled: boolean;
    filePaths: string[];
}
export interface MessageBoxOptions {
    message: string;
    title?: string;
    detail?: string;
    type?: "none" | "info" | "error" | "question" | "warning";
    buttons?: string[];
    defaultId?: number;
}
export interface MessageBoxReturnValue {
    response: number;
    checkboxChecked?: boolean;
}
export declare const dialog: {
    /**
     * Electron-compatible showOpenDialog
     */
    showOpenDialog(browserWindowOrOptions?: any, options?: OpenDialogOptions): Promise<OpenDialogReturnValue>;
    /**
     * Convenience alias
     */
    openFile(options?: OpenDialogOptions): Promise<{
        canceled: boolean;
        path: string;
    }>;
    /**
     * Electron-compatible showMessageBox
     */
    showMessageBox(browserWindowOrOptions?: any, options?: MessageBoxOptions): Promise<MessageBoxReturnValue>;
    /**
     * Electron-compatible showSaveDialog
     */
    showSaveDialog(browserWindowOrOptions?: any, options?: any): Promise<{
        canceled: boolean;
        filePath?: string;
    }>;
    /**
     * Electron-compatible showErrorBox
     */
    showErrorBox(title: string, content: string): void;
    /**
     * Convenience alias
     */
    showMessage(title: string, message: string): Promise<void>;
};
//# sourceMappingURL=dialog.d.ts.map