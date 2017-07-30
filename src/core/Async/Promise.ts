import { defer, runYield} from "./Defer";
import { UnhandledException, Signal } from "./Signal";

/** Represents a value to be resolved at any time in the future */
export class Promise<T> implements PromiseLike<T> {
    /** Delay the execution of a callback but return a promise for its result */
    public static delay<T>(f: (...args: any[]) => T, ms: number, args?: any[]) {
        var result = new Promise<T>();

        // set a timer and run all deferred functions right away (e.g. .then(...))
        setTimeout(function () {
            result._resolveWith(r => r(f.apply(undefined, args)));
            runYield();
        }, ms);
        return result;
    }

    /** Return a promise that will be resolved after a delay */
    public static sleep<T>(ms: number, value?: T): Promise<T> {
        return Promise.delay(() => value!, ms);
    }

    /** Defer the execution of a callback but return a promise for its result */
    public static defer<T>(f: (...args: any[]) => T, args?: any[]) {
        var result = new Promise<T>();
        defer(() => { result._resolveWith(r => r(f.apply(undefined, args))) });
        return result;
    }

    /** Executes given callback, providing it with a Node.js-style (err, result) => {...} handler that immediately resolves or rejects the resulting promise when called; (use as e.g. `Promise.fn(f => fs.readFile('/etc/passwd', f)).then(...))` */
    public static fn<T>(callback: (f: (err: any, result: T) => void) => void) {
        return new Promise<T>((resolve, reject) => {
            callback((err: any, result: T) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    /** Return a resolved promise */
    public static resolve<T>(value: T) {
        return new Promise<T>()._resolve(value);
    }

    /** Return a rejected promise */
    public static reject(error: Error) {
        return new Promise()._reject(error);
    }

    /** Return a promise that is fulfilled when all given promises are fulfilled and is immediately rejected when one of the promises is rejected */
    public static all<ValueT>(promises: PromiseLike<ValueT>[]) {
        var result = new Promise<ValueT[]>();
        var values: any[] = [];
        var left = promises.length;

        // fulfill promise if not rejected before
        function fulfill() {
            !result._isRejected && result._resolve(values);
        }

        // wait for each given promise
        promises.forEach((p, i) => {
            p.then(
                value => {
                    values[i] = value;
                    --left || fulfill();
                },
                error => {
                    result._reject(error);
                });
        });

        // fulfill already if no promises given
        !left && fulfill();
        return result;
    }

    /** Return a promise that is resolved or rejected exactly like the first of the given promises that is resolved or rejected */
    public static race<T>(promises: PromiseLike<T>[]) {
        var result = new Promise<T>();
        promises.forEach(p => {
            p.then(value => result._resolve(value), error => result._reject(error));
        });
        return result;
    }

    /** Create a new Promise instance by running the given callback function, which is given callbacks to resolve and/or reject the promise; the promise is also rejected if the callback function throws an exception */
    constructor(executor?: (resolve: (value: PromiseLike<T> | T) => void,
        reject: (error: Error) => void) => void) {
        if (typeof executor === "function")
            this._resolveWith(executor);
    }

    /** Run one of the callbacks as soon as the promise is fulfilled or rejected */
    then<O>(onFulfilled?: (value: T) => (PromiseLike<O> | O),
        onRejected?: (error: Error) => (PromiseLike<O> | O)): Promise<O>;

    /** Run one of the callbacks as soon as the promise is fulfilled or rejected */
    then<O>(onFulfilled?: (value: T) => (PromiseLike<O> | O),
        onRejected?: (error: Error) => void): Promise<O>;

    public then<O>(onFulfilled?: (value: T) => any,
        onRejected?: (error: Error) => any) {
        var result = new Promise<O>();
        if (this._isResolved) {
            // if already fulfilled, schedule call to onFulfilled or fulfill now
            if (typeof onFulfilled === "function")
                defer(() => { result._resolveWith(r => r(onFulfilled(this._value))) });
            else
                result._resolve(<any>this._value);
        }
        else if (this._isRejected) {
            // if already rejected, schedule call to onRejected or reject now
            if (typeof onRejected === "function")
                defer(() => { result._resolveWith(r => r(onRejected(this._error))) });
            else
                result._reject(this._error);

            // set flag to make sure UnhandledException does not get called async
            this._hndRejection = true;
        }
        else {
            // fulfill result when ready
            if (typeof onFulfilled === "function") {
                this._Resolve._connect(v =>
                    result._resolveWith(r => r(onFulfilled(v))));
            }
            else {
                // pass on result if no handler passed in
                this._Resolve._connect(v => result._resolve(<any>v));
            }

            // handle rejections
            if (typeof onRejected === "function") {
                this._Reject._connect(v =>
                    result._resolveWith(r => r(onRejected(v))));
            }
            else {
                // pass on rejections if no handler passed in
                this._Reject._connect(v => result._reject(v));
            }
        }

        // always return a promise with the result of onFulfilled OR onRejected
        return result;
    }

    /** Catch rejections and return a new promise */
    catch<O>(onRejected?: (error: Error) => (PromiseLike<O> | O)): Promise<O>;

    /** Catch rejections and return a new promise */
    catch<O>(onRejected?: (error: Error) => void): Promise<O>;

    public catch(onRejected?: (error: Error) => any) {
        return this.then(undefined, onRejected);
    }

    /** @internal Return current status: null if unfulfilled, object with value property (if resolved), and/or error property (if rejected) */
    public _getStatus(): { value?: T, error?: any, rejected?: boolean } | null {
        if (this._isResolved) return { value: this._value };
        if (this._isRejected) return { rejected: true, error: this._error };
        return null;
    }

    /** @internal Resolve the promise with a value, or (future) result of a promise */
    private _resolve(value?: PromiseLike<T> | T, resolving?: object) {
        if (!this._isResolved && !this._isRejected &&
            (!this._resolving || resolving === this._resolving)) {
            if (value === this) throw new TypeError("Recursive promise found");
            try {
                var thenFn = value && (<any>value).then;
                if (typeof thenFn === "function" &&
                    ((typeof value === "object") || (typeof value === "function"))) {
                    // wait for promise to be resolved and recurse
                    resolving = this._resolving = {};
                    thenFn.call(value,
                        (v: any) => { this._resolve(v, resolving) },
                        (e: any) => { this._reject(e, resolving) });
                }
                else {
                    // set status and schedule handler chain (if any)
                    this._isResolved = true;
                    delete this._resolving;
                    this._value = <T>value;
                    this._Resolve.emit(<T>value);

                    // remove signal references to help garbage collection
                    delete this._Resolve;
                    delete this._Reject;
                }
            }
            catch (e) {
                // oops, caught an exception, now reject this promise
                this._reject(e, resolving);
            }
        }
        return this;
    }

    /** @internal Run a function that may resolve or reject the promise, if still not fulfilled */
    private _resolveWith(executor: (resolve: (value: PromiseLike<T> | T) => void,
        reject: (error: Error) => void) => void) {
        try {
            // call resolver function with callback for resolving this promise
            this._isResolved || this._isRejected ||
                executor(v => { this._resolve(v) }, e => { this._reject(e) });
        }
        catch (e) {
            // oops, caught an exception, now reject this promise
            this._reject(e);
        }
        return this;
    }

    /** @internal Reject the promise because an error occurred */
    private _reject(error: Error, resolving?: object) {
        // set status and schedule handler chain (if any)
        if (!this._isResolved && !this._isRejected &&
            (!this._resolving || resolving === this._resolving)) {
            this._isRejected = true;
            this._error = error;
            if (this._Reject.isConnected()) {
                // emit signal which is handled by onRejected handler(s)
                this._Reject.emit(error);

                // remove signal references to help garbage collection
                delete this._Resolve;
                delete this._Reject;
            }
            else {
                // emit signal async if still not handled
                // (wait for chained calls on already-rejected promise)
                defer(() => {
                    this._hndRejection ||
                        UnhandledException.emit(error);
                })
            }
        }
        return this;
    }

    /* @internal */
    private _isResolved: boolean;
    /* @internal */
    private _isRejected: boolean;
    /* @internal */
    private _resolving?: object;
    /* @internal */
    private _hndRejection: boolean;
    /* @internal */
    private _value: T;
    /* @internal */
    private _error: Error;

    /* @internal */
    private _Resolve = Signal.create<T>();
    /* @internal */
    private _Reject = Signal.create<Error>();
}

/** Return a promise that will be resolved after a delay */
export function sleep<PromiseT>(ms: number, value?: PromiseT) {
    return Promise.delay(() => value!, ms);
}
