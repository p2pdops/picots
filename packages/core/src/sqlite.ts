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

export class Statement<BindParameters extends any[] = any[], Result = any> {
  private _sql: string;
  private _db: Database;
  private _isPluck: boolean = false;
  private _isRaw: boolean = false;

  constructor(db: Database, sql: string) {
    this._db = db;
    this._sql = sql.trim();
  }

  run(...params: BindParameters): RunResult {
    return {
      changes: 1,
      lastInsertRowid: Date.now(),
    };
  }

  get(...params: BindParameters): Result | undefined {
    const all = this.all(...params);
    return all.length > 0 ? all[0] : undefined;
  }

  all(...params: BindParameters): Result[] {
    return [];
  }

  *iterate(...params: BindParameters): IterableIterator<Result> {
    const rows = this.all(...params);
    for (const row of rows) {
      yield row;
    }
  }

  pluck(toggle: boolean = true): this {
    this._isPluck = toggle;
    return this;
  }

  raw(toggle: boolean = true): this {
    this._isRaw = toggle;
    return this;
  }

  get source(): string {
    return this._sql;
  }
}

export class Database {
  public name: string;
  public memory: boolean;
  public readonly: boolean;
  public open: boolean = true;
  public inTransaction: boolean = false;

  constructor(filename: string = ":memory:", options: DatabaseOptions = {}) {
    this.name = filename;
    this.memory = filename === ":memory:";
    this.readonly = !!options.readonly;
  }

  prepare<BindParameters extends any[] = any[], Result = any>(
    sql: string
  ): Statement<BindParameters, Result> {
    return new Statement<BindParameters, Result>(this, sql);
  }

  exec(sql: string): this {
    return this;
  }

  transaction<T extends (...args: any[]) => any>(fn: T): T {
    const wrapped = (...args: Parameters<T>): ReturnType<T> => {
      this.inTransaction = true;
      try {
        const result = fn(...args);
        return result;
      } finally {
        this.inTransaction = false;
      }
    };
    return wrapped as T;
  }

  pragma(pragma: string, options: { simple?: boolean } = {}): any {
    return options.simple ? 1 : [{ pragma: 1 }];
  }

  backup(destination: string): Promise<void> {
    return Promise.resolve();
  }

  close(): this {
    this.open = false;
    return this;
  }
}

export default Database;
