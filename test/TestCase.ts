/// <reference path="definitions.d.ts" />

export type TestCallback = (t: TestCase) => void | Promise<any>;

export interface TestGroup {
    name: string;
    cases: TestCase[];
}

export class TestCase {
    constructor(
        public readonly groupName: string,
        public readonly name: string,
        public readonly callback?: TestCallback) {
        this._promise = new Promise(resolve => {
            this._resolve = () => {
                this._resolved = true;
                resolve();
            };
        });
    }

    failOnTimeout(ms = 5000, comment?: string) {
        this._timed = true;
        setTimeout(() => {
            if (!this._resolved) {
                let msg = "Timeout" + (comment ? ": " + comment : "");
                this._error = Error(this._testNameToString(msg));
                this._resolve();
            }
        }, ms);
    }

    assert(value: any, comment?: string) {
        if (!value) {
            this._error = Error(this._testNameToString(
                comment || "Assertion failed"));
        }
        this._resolve();
    }

    fail(err: string): void;
    fail(err?: any): void;
    fail(err?: any) {
        if (typeof err === "string") {
            err = Error(this._testNameToString("Failure"));
        }
        this._error = err || new Error(this._testNameToString("Failure"));
        this._resolve();
    }

    ok() {
        this._resolve();
    }

    async runAsync() {
        try {
            if (this.callback) await this.callback(this);
            else this._resolve();
        }
        catch (err) {
            this._error = err;
            this._resolve();
        }
        if (!this._resolved && !this._timed) {
            this._error = Error("Case is not resolved");
            this._resolve();
        }
        return this._promise;
    }

    getError() {
        return this._error;
    }

    private _testNameToString(comment?: string) {
        return (comment ? comment + " in " : "") +
            '"' + this.name + '" (' + this.groupName + ')';
    }

    private _promise: Promise<any>;
    private _resolve!: () => void;
    private _resolved?: boolean;
    private _timed?: boolean;
    private _error?: any;
}

const _tests: TestGroup[] = [];
let _current: TestGroup | undefined;

export function consider(name: string, callback: () => void) {
    _tests.push(_current = { name, cases: [] });
    callback();
    _current = undefined;
}

export function it(name: string, callback?: TestCallback) {
    if (!_current) {
        throw Error("Cannot call it(...) outside of consider(...) context");
    }
    _current.cases.push(new TestCase(_current.name, name, callback));
}

export function getTestGroups() {
    return _tests;
}
