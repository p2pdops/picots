export interface FileEntry {
    name: string;
    isDirectory: boolean;
    size: number;
}
export interface ListFilesResult {
    dir: string;
    items: FileEntry[];
}
export declare const fs: {
    listFiles(dir?: string): Promise<ListFilesResult>;
};
//# sourceMappingURL=fs.d.ts.map