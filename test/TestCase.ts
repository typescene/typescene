/// <reference path="definitions.d.ts" />

export type TestCallback = (t: TestCase) => void | Promise<any>;

/** Represents a group of tests, created using `consider` */
export interface TestGroup {
  name: string;
  cases: TestCase[];
}

/** Represents a single test case within a test group */
export class TestCase {
  constructor(
    public readonly groupName: string,
    public readonly name: string,
    public readonly callback?: TestCallback
  ) {
    this._promise = new Promise(resolve => {
      this._resolve = () => {
        this._resolved = true;
        if (this._failTimer) {
          clearTimeout(this._failTimer);
        }
        resolve();
      };
    });
  }

  /** Fails the test case immediately with given message and throws an error */
  fail(err: string): void;
  /** Fails the test case immediately with given error and throws the error */
  fail(err?: any): void;
  fail(err?: any) {
    if (typeof err === "string") {
      err = Error(this._testNameToString("Failure"));
    }
    this._error = err || new Error(this._testNameToString("Failure"));
    this._resolve();
    throw err;
  }

  /** Resolves the test case */
  ok() {
    this._resolve();
  }

  /** Fails the test case and throws an error if given value is not falsy; does NOT resolve the test case if the value is true */
  assert(value: any, comment?: string) {
    if (!value) {
      this._error = Error(this._testNameToString(comment || "Assertion failed"));
      this._resolve();
      throw Error("Assertion failed");
    }
  }

  /** Fails the test case and throws an error if given value is not falsy; resolves the test case if the value is true */
  test(value: any, comment?: string) {
    if (!value) this.assert(value, comment || "Test failed");
    this._resolve();
  }

  /** Resolves the test case when this method is called n times */
  count(n: number) {
    if (!this._count) this._count = 0;
    if (++this._count! >= n) this._resolve();
  }

  /** Starts a timer and fails the test case if the case has not been resolved afterwards */
  failOnTimeout(ms = 5000, comment?: string) {
    this._failTimer = setTimeout(() => {
      if (!this._resolved) {
        let msg = "Timeout" + (comment ? ": " + comment : "");
        this._error = Error(this._testNameToString(msg));
        this._resolve();
      }
    }, ms);
  }

  /** Wait for given number of milliseconds (defaults to 100) while test case remains unresolved, and run given callback, if any; also returns a promise, but only one call to `waitAsync` can be active at a time */
  async waitAsync(ms = 100, callback?: () => void) {
    if (this._waiting) throw Error("Already waiting once for the same test case");
    this._waiting = true;
    await new Promise(r => {
      setTimeout(r, ms);
    });
    this._waiting = false;
    if (callback) return this._goAsync(callback);
  }

  /** Runs the test case and awaits the callback and any timeouts */
  async runAsync() {
    return this._goAsync(this.callback);
  }

  /** Returns true if the test case has been resolved successfully; returns false if the test case is pending, has failed, or if there was no callback defined */
  isOK() {
    return this._resolved && this.callback && !this._error;
  }

  /** Returns the resulting error, if any */
  getError() {
    return this._error;
  }

  /** Returns the current count (as incremented by `count()`) */
  getCount() {
    return this._count || 0;
  }

  private _testNameToString(comment?: string) {
    return (
      (comment ? comment + " in " : "") + '"' + this.name + '" (' + this.groupName + ")"
    );
  }

  private async _goAsync(callback?: (t: this) => void) {
    try {
      if (callback) await callback(this);
      else this._resolve();
    } catch (err) {
      this._error = err;
      this._resolve();
    }
    if (!this._resolved && !this._failTimer && !this._waiting) {
      this._error = Error("Case is not resolved");
      this._resolve();
    }
    return this._promise;
  }

  private _promise: Promise<any>;
  private _resolve!: () => void;
  private _resolved?: boolean;
  private _failTimer?: any;
  private _waiting?: boolean;
  private _error?: any;
  private _count?: number;
}

const _tests: TestGroup[] = [];
let _current: TestGroup | undefined;

/** Creates a named test group, and runs given callback in the context of this group */
export function consider(name: string, callback: () => void) {
  _tests.push((_current = { name, cases: [] }));
  callback();
  _current = undefined;
}

/** Creates a test case within the current test group (must be run within a callback provided to `consider`) */
export function it(name: string, callback?: TestCallback) {
  if (!_current) {
    throw Error("Cannot call it(...) outside of consider(...) context");
  }
  _current.cases.push(new TestCase(_current.name, name, callback));
}

/** Returns the list of created test groups */
export function getTestGroups() {
  return _tests;
}
