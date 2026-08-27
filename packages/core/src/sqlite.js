export class Statement {
    _sql;
    _db;
    _isPluck = false;
    _isRaw = false;
    constructor(db, sql) {
        this._db = db;
        this._sql = sql.trim();
    }
    run(...params) {
        return {
            changes: 1,
            lastInsertRowid: Date.now(),
        };
    }
    get(...params) {
        const all = this.all(...params);
        return all.length > 0 ? all[0] : undefined;
    }
    all(...params) {
        return [];
    }
    *iterate(...params) {
        const rows = this.all(...params);
        for (const row of rows) {
            yield row;
        }
    }
    pluck(toggle = true) {
        this._isPluck = toggle;
        return this;
    }
    raw(toggle = true) {
        this._isRaw = toggle;
        return this;
    }
    get source() {
        return this._sql;
    }
}
export class Database {
    name;
    memory;
    readonly;
    open = true;
    inTransaction = false;
    constructor(filename = ":memory:", options = {}) {
        this.name = filename;
        this.memory = filename === ":memory:";
        this.readonly = !!options.readonly;
    }
    prepare(sql) {
        return new Statement(this, sql);
    }
    exec(sql) {
        return this;
    }
    transaction(fn) {
        const wrapped = (...args) => {
            this.inTransaction = true;
            try {
                const result = fn(...args);
                return result;
            }
            finally {
                this.inTransaction = false;
            }
        };
        return wrapped;
    }
    pragma(pragma, options = {}) {
        return options.simple ? 1 : [{ pragma: 1 }];
    }
    backup(destination) {
        return Promise.resolve();
    }
    close() {
        this.open = false;
        return this;
    }
}
export default Database;
