export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}
export interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: any, ...additionalArgs: any[]) => void;
}
export declare class Statement<BindParameters extends any[] = any[], Result = any> {
    private _sql;
    private _db;
    private _isPluck;
    private _isRaw;
    constructor(db: Database, sql: string);
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): Result | undefined;
    all(...params: BindParameters): Result[];
    iterate(...params: BindParameters): IterableIterator<Result>;
    pluck(toggle?: boolean): this;
    raw(toggle?: boolean): this;
    get source(): string;
}
export declare class Database {
    name: string;
    memory: boolean;
    readonly: boolean;
    open: boolean;
    inTransaction: boolean;
    constructor(filename?: string, options?: DatabaseOptions);
    prepare<BindParameters extends any[] = any[], Result = any>(sql: string): Statement<BindParameters, Result>;
    exec(sql: string): this;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    pragma(pragma: string, options?: {
        simple?: boolean;
    }): any;
    backup(destination: string): Promise<void>;
    close(): this;
}
export default Database;
//# sourceMappingURL=sqlite.d.ts.map