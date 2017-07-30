import { defer } from "./Defer";
import { Promise } from "./Promise";
import { Signal, SignalConnection } from "./Signal";
import { ObservableObject, makeObjectObservable } from "./ObservableObject";
import { ObservableArray } from "./ObservableArray";

/** Watched observable currently evaluating, if any; used to connect dependencies through signals */
var currentWatchedEvaling: ObservableValue<any> | undefined;

/** Unwatched observable currently evaluating, if any; used to collect dependencies for dirty checking */
var currentUnwatchedEvaling: ObservableValue<any> | undefined;

/** @internal Throws an error if currently running an observable getter */
export function assertUnobserved() {
    if (currentWatchedEvaling || currentUnwatchedEvaling)
        throw new Error("Observable getter must be a pure function, " +
            "cannot create or set other observables");
}

/** Represents a connection to a dependency */
interface DependencyConnection {
    /** The observable value dependency itself */
    dep: ObservableValue<any>;

    /** Function to disconnect from this dependency's signal */
    dis: () => void;
}

/** Represents an observable value (with the value itself in `.value`) */
export class ObservableValue<T> {
    /** Returns true if currently running in a subscribed-to observable context (i.e. evaluating an observable value, recording dependencies on other observable values being accessed from this context) */
    public static isObserving() {
        return !!currentWatchedEvaling;
    }

    /** Encapsulate given value as an ObservableValue */
    public static fromValue<T>(value: T) {
        var result = new ObservableValue<T>();
        result.value = value;
        return result;
    }

    /** Encapsulate given promised value as an ObservableValue; the observed value will start out as `undefined` but then changes to the `Promise` result when resolved; or if promise was rejected, hangs on to the error and throws it when retrieving the observable value */
    public static fromPromise<T>(valuePromise: PromiseLike<T>) {
        var result = new ObservableValue<T>();
        if (valuePromise instanceof Promise) {
            // shortcut promise status to avoid async
            var status = valuePromise._getStatus();
            if (status) {
                if (status.rejected) {
                    // set value to "error" to trigger change signal
                    result.value = <any>"error";
                    result._error = status.error;
                    result._ro = result._nc = true;
                    return result;
                }
                else {
                    // set value to resolved promise value
                    result.value = status.value;
                    result._ro = result._nc = true;
                    return result;
                }
            }
            // if not fulfilled yet, use .then anyway:
        }
        valuePromise.then(value => {
            // set value to resolved promise value
            result.value = value;
            result._ro = result._nc = true;
        }, error => {
            // set value to "error" to trigger change signal
            result.value = <any>"error";
            result._error = error;
            result._ro = result._nc = true;
        });
        return result;
    }

    /** Connect to given `Signal`, and create a read-only observable value that always contains the last emitted signal value (initially undefined; the value is only set after the next time the signal is emitted) */
    public static fromSignal<T>(signal: Signal.Emittable<T>) {
        var result = new ObservableValue<T>();
        result._ro = true;
        signal._connect(v => {
            result._ro = false;
            result.value = v;
            result._ro = true;
        });
        return result;
    }

    /** Create a new (single) observed value using optional getter and setter functions; note that getters *should* be pure functions without side effects, creating or setting other observables from the getter will result in an error; getter is not called immediately but only when being subscribed to or when obtaining the value itself (from `.value`) */
    constructor(getter?: () => T, setter?: (value: T) => void) {
        assertUnobserved();

        // hold off on evaluating until value getter is called
        if (getter) {
            this._getter = getter;
            this._dirtyIdx++;
        }
        this._setter = setter;
    }

    /** Set a getter function for the observable value, which should return a current value, or another ObservableValue instance, or set `.value` directly; note that getters *should* be pure functions without side effects, creating or setting other observables from the getter will result in an error; the getter is only invoked (asynchronously) if a value had been set previously and needs to be updated; reading `.value` from the getter results in the value previously set, no recursion occurs; returns this */
    public getter(f: () => T) {
        if (this._ro) throw new Error("Cannot modify this observable value");
        assertUnobserved();
        this._getter = f;

        // remove current static value and re-eval if needed
        if (Object.prototype.hasOwnProperty.call(this, "_val")) {
            if (f) delete this._val;
            this._asyncEval();
        }
        if (!f) {
            // remove all (old getter's) dependencies if clearing getter
            this._removeDependencies();
        }

        return this;
    }

    /** Set a setter function for the observable value; setting `.value` directly from the setter results in changing the underlying observable value (which can also be read by the getter, or the setter itself), no recursion occurs; returns this */
    public setter(f: (value: T) => void) {
        if (this._ro) throw new Error("Cannot modify this observable value");
        assertUnobserved();
        this._setter = f;
        return this;
    }

    /** Observable value, (re-) evaluated only if necessary; when set to an `ObservableValue` instance, this property returns that instance's value, until this property is set to another value (except if the `ObservableValue` has a setter, which is called first); plain Array values are turned into `ObservableArray` instances, and plain Object instances into `ObservableObject` instances --- unless `.shallow` is set to true */
    get value(): T | undefined {
        if (this._error) throw this._error;

        // return current value if running getter, setter, or value will not
        // change and is not proxied from another observable value:
        if (this._getting && !this._set) return undefined;
        if (this._getting || this._setting ||
            this._nc && !(this._val instanceof ObservableValue))
            return this._val;

        // register as dependency to previously evaluating observable
        if (currentWatchedEvaling)
            currentWatchedEvaling._addConnection(this);
        else if (currentUnwatchedEvaling)
            currentUnwatchedEvaling._addCheck(this);

        // re-evaluate if necessary:
        var hadValue = !!this._valIdx;
        var oldValue = this._val;
        if (this._needsEval()) {
            this._oldConnections = this._depConnections;

            // set this instance as currently evaluating to find dependencies
            var prevWatched = currentWatchedEvaling,
                prevUnwatched = currentUnwatchedEvaling;
            if (this._watched) {
                currentWatchedEvaling = this;
                this._depConnections = {};
            }
            else {
                currentUnwatchedEvaling = this;
                this._depChecks = [];
            }
            this._getting = true;
            this._direct = false;

            try {
                // store getter result or let getter set value directly
                var result = this._getter!.call(undefined);
                if (!(result === undefined && this._direct))
                    this._val = result;
            }
            finally {
                this._getting = false;

                // stop solliciting dependencies
                currentWatchedEvaling = prevWatched;
                currentUnwatchedEvaling = prevUnwatched;

                // unsubscribe from old dependencies that are no longer used
                var oldConnections = this._oldConnections;
                delete this._oldConnections;
                if (this._depConnections) {
                    for (var uid in oldConnections)
                        if (!this._depConnections[uid])
                            oldConnections[uid].dis();
                }
            }

            // mark value as up to date
            this._valIdx = this._dirtyIdx;
        }

        // return new value
        var value = this._val;

        // proxy other ObservableValues' values
        var oldConnection = this._proxyConnection;
        if (!this.shallow && value instanceof ObservableValue) {
            if (this._watched) {
                // subscribers should also be notified for proxy value changes
                // (until next value is evaluated, or this observable is
                // unsubscribed from)
                var proxied = (<ObservableValue<T>>value);
                var sig = <Signal.Emittable<T>><any>proxied;
                this._proxyConnection = sig.connect(v => {
                    if (this._val === <any>proxied)
                        (<Signal.Emittable<T>><any>this).emitSync(v);
                });
            }
            value = value.value;
        }
        if (oldConnection) {
            oldConnection.disconnect();
            if (this._proxyConnection === oldConnection)
                delete this._proxyConnection;
        }

        // emit signal(s) if changed
        if (hadValue && this._val !== oldValue) {
            this._auxCallbacks && this._auxCallbacks.forEach(f => f());
            (<Signal.Emittable<T>><any>this).emitSync(value!);
        }

        return value;
    }
    set value(value) {
        if (!this._getting && !this._setting) assertUnobserved();

        // convert plain arrays and objects (unless about to run setter)
        if (!this.shallow && (!this._setter || this._setting)) {
            // make ObservableArray instances out of plain Arrays
            if (value instanceof Array && value.constructor === Array) {
                value = <any>ObservableArray.fromArray(<any>value);
            }
            // make ObservableObject instances out of plain Objects
            if (value instanceof Object && value.constructor === Object) {
                value = <any>makeObjectObservable(<any>value);
            }
        }

        // check what to do with the new value:
        if (this._getting) {
            // set value directly, no signals but mark as changed
            this._val = value;
            this._set = true;
            this._direct = true;
            this._valIdx = ++this._dirtyIdx;
        }
        else if (this._getter && !this._setter || this._ro) {
            // cannot set value directly outside of getter function
            // (or value is resolved Promise)
            throw new Error("Cannot set value");
        }
        else if ((!this._setter || this._setting) &&
            (this._val instanceof ObservableValue) &&
            (<any>this._val)._setter) {
            // proxy through observable value setter
            (<any>this._val).value = value;
        }
        else if (this._setter && !this._setting) {
            // invoke setter
            this._setting = true;
            try { this._setter.call(undefined, value); }
            finally { this._setting = false; }
        }
        else if (value !== this._val) {
            // mark value as changed (but not dirty)
            this._valIdx = ++this._dirtyIdx;

            // set value and emit signal(s)
            this._val = value;
            this._set = true;
            this._auxCallbacks && this._auxCallbacks.forEach(f => f());
            (<Signal.Emittable<T>><any>this).emitSync(value!);
        }
        else {
            this._set = true;
        }
    }

    /** Returns .value (observable if used within an observable getter) */
    public valueOf() { return this.value }

    /** Returns .value as a string (observable if used within an observable getter) */
    public toString() { return String(this.value) }

    /** Returns last value set, does not re-evaluate and/or add dependency */
    public getLastValue() {
        // return value or proxy other ObservableValue's value
        var value = this._val;
        while (value instanceof ObservableValue) value = (<any>value).getLastValue();
        return value;
    }

    /** Transform this observable value using given function, into a new ObservableValue instance; note that the transformation function is not necessarily invoked after each value change, if the new observable is not subscribed to and/or multiple changes occur (asynchronously) before the transformation is evaluated; observables used by the given function itself are not automatically subscribed to (wrap given function in observe(...) to observe dependencies as well) */
    public map<U>(callback: (value: T) => U): ObservableValue<U> {
        var lastValue: T = <any>{};
        var mapped: ObservableValue<any> = new ObservableValue(() => {
            var value = this.value;
            if (value === lastValue) return mapped.value;
            mapped.value = unobserved(callback, lastValue = value!);
        });
        return mapped;
    }

    /** Start listening for changes to this observable value and all of its dependencies asynchronously; returns this */
    public subscribe(): this;

    /** Start listening for changes to this observable value and all of its dependencies asynchronously, and schedule given function for every new value (including the current value, or undefined if none has been set); returns this */
    public subscribe(callback: (value: T) => any): this;

    public subscribe(callback?: (value: T) => any) {
        (<Signal.Emittable<T>><any>this)._connect(<any>callback);

        // listen for signal emissions while initializing value if needed
        var current = this._val, emitted = false, f: any;
        if (this._getter || this._val instanceof ObservableValue) {
            if (!this._auxCallbacks) this._auxCallbacks = [];
            this._auxCallbacks.push(f = () => { emitted = true });
            unobserved(() => { current = this.value });
            if (this._auxCallbacks.length === 1) delete this._auxCallbacks;
            else this._auxCallbacks = this._auxCallbacks.filter(v => v !== f);
        }

        // if not already emitted signal, invoke callback for current value
        if (!emitted) callback && defer(callback, [current]);
        return this;
    }

    /** Start listening for changes to this observable value and all of its dependencies asynchronously, and return a promise for the next (different) value of the observable; does _not_ force evaluation of the current value (i.e. getters are not called); stops subscribing immediately after the promise is resolved */
    public next() {
        // force signal even if no value had been set yet
        if (!this._valIdx) this._valIdx = -1;

        return new Promise<T>(resolve => {
            (<Signal.Emittable<T>><any>this).connectOnce(v => { resolve(v) });
        });
    }

    /** True if this observable value is currently subscribed to, either directly or from dependent observables */
    public get subscribed() { return !!this._watched }

    /** True if this observable value is writable (not only a getter defined) */
    public get writable() { return !(this._ro || this._getter && !this._setter) }

    /** Set to true to stop this observablue value instance from converting arrays and objects to observables, and reading values from observable value instances */
    public shallow?: boolean;

    /** @internal Add a callback to invoke (synchronously) when this value changes, but do not watch for changes directly (i.e. does not connect to signal and start watching), callback must NOT throw an exception; used for emitting Observable.PropertyChange */
    public invokeOnChange<DataT>(callback: () => void) {
        if (!this._auxCallbacks) this._auxCallbacks = [];
        this._auxCallbacks.push(callback);
    }

    /** Clear value and remove getter/setter functions, unsubscribe from dependencies */
    public clear() {
        this.getter(<any>undefined).setter(<any>undefined);
        delete this._val;
        delete this._set;
    }

    /** Manually invoke the getter function synchronously, if any; can be used only if not currently evaluating another observable value (otherwise, wrap in a call to `unobserved`); calling this method is normally not necessary, and should only be used if external factors outside of observables change in such a way that the result of the getter function changes; if so, then subsequent retrieval of `.value` results in the new value, and dependent observable values are scheduled to update automatically (asynchronously) */
    public update() {
        assertUnobserved();
        if (this._getter) {
            this._dirtyIdx++;
            this.value;
        }
    }

    /** @internal Returns true if value needs to be reevaluated */
    private _needsEval() {
        if (!this._getter) return false;
        if ((this._valIdx || 0) !== this._dirtyIdx) return true;

        // if value is watched, then dependencies are watched too
        // and are up to date if value is up to date (above check)
        if (this._watched) return false;

        // check if dependencies (may) have changed since last evaluation
        return !this._depChecks || this._depChecks.some(f => f({}));
    }

    /** @internal Mark as dirty (if not already dirty) and schedule re-evaluation of value if still watched */
    private _asyncEval() {
        if ((this._valIdx || 0) === this._dirtyIdx && !this._getting) {
            this._dirtyIdx++;
            defer(() => {
                if (this._watched && this._valIdx !== this._dirtyIdx)
                    this.value;
            });
        }
    }

    /** @internal Register a watched dependency of this value */
    private _addConnection(other: ObservableValue<any>) {
        if (other === this) return;
        if (!this._depConnections) this._depConnections = {};

        // check if connection already existed
        var old: DependencyConnection;
        if (this._oldConnections && (old = this._oldConnections[other._uid])) {
            // use existing object
            this._depConnections[other._uid] = old;
        }
        else {
            // add handler to mark this value as dirty whenever other value
            // changes (not async since signal is always emitted synchronously,
            // see above); _connect returns disconnect method
            var dis = (<Signal.Emittable<T>><any>other)._connect(
                this._asyncEval.bind(this));

            // store new dependency object
            this._depConnections[other._uid] = { dep: other, dis };
        }
    }

    /** @internal Register an unwatched dependency of this value (checked for changes every time when getting the unwatched observable value) */
    private _addCheck(other: ObservableValue<any>) {
        if (other === this) return;

        // maintain a function to check if the other value has changed
        // (different _dirtyIdx or recurse down dependency tree)
        var lastDirtyIdx = other._dirtyIdx;
        (this._depChecks || (this._depChecks = [])).push((seen: any) => {
            if (seen[this._uid]) return true;
            seen[this._uid] = true;
            return (other._dirtyIdx !== lastDirtyIdx ||
                !other._depChecks || other._depChecks.some(f => f(seen)));
        });
    }

    /** @internal Disconnect existing dependencies */
    private _removeDependencies() {
        delete this._depChecks;
        var connections = this._depConnections;
        delete this._depConnections;
        for (var uid in connections)
            connections[uid].dis();

        // also disconnect from proxied observable, if any
        if (this._proxyConnection) {
            this._proxyConnection.disconnect();
            delete this._proxyConnection;
        }
    }

    /** @internal handler for first signal connection */
    protected onHandlerConnected() {
        this._watched = true;
        if (!this._depChecks || this._depChecks.length) {
            // not sure about dependencies, force re-eval
            this._removeDependencies();
            this._dirtyIdx++;
        }
        else {
            // no dependencies last time, no need to check
            this._removeDependencies();
        }
    }

    /** @internal handler for last signal disconnection */
    protected onHandlersDisconnected() {
        this._watched = false;
        this._removeDependencies();
    }

    /** @internal Unique ID used to quickly index dependants of observables */
    private _uid = String(++ObservableValue.UID);

    /** @internal */
    static UID = 0;

    /** @internal Functions to emit other signal(s) when value changes */
    private _auxCallbacks: (() => void)[];

    /** @internal True if this observable value is currently watched */
    private _watched: boolean;

    /** @internal True if currently evaluating (in getter) */
    private _getting: boolean;

    /** @internal True if currently setting value (in setter) */
    private _setting: boolean;

    /** @internal Getter function, if any */
    private _getter?: () => T;

    /** @internal Setter function, if any */
    private _setter?: (value: T) => void;

    /** @internal Last evaluated result */
    private _val?: T;

    /** @internal Counter that is incremented every time the value becomes unstable (i.e. value set directly, dependency changed, etc.) */
    private _dirtyIdx = 0;

    /** @internal Value of _dirtyIdx when _val was set (i.e. if not the same as _dirtyIdx, the observable is dirty; changes along with _dirtyIdx every time the value changes) */
    private _valIdx: number;

    /** @internal True if value was set directly using .value, while running getter */
    private _direct: boolean;

    /** @internal True if value was _ever_ set directly using .value (until `.clear` is called), used to determine whether getter should return `.val` while running getter itself */
    private _set: boolean;

    /** @internal True if value is read-only (i.e. result of Promise) */
    private _ro: boolean;

    /** @internal True if value will not change (i.e. result of Promise) */
    private _nc: boolean;

    /** @internal Error to be thrown when value is retrieved (Promise rejected) */
    private _error: any;

    /** @internal Connections for signals of values encountered as dependencies during last evaluation while watched */
    private _depConnections: { [id: string]: DependencyConnection };

    /** @internal Connections for signals of values encountered as dependencies during older evaluation while watched */
    private _oldConnections: { [id: string]: DependencyConnection };

    /** @internal Functions provided by dependencies to check if their values (may) have changed since last evaluation while not watched */
    private _depChecks: ((seen: object) => boolean)[];

    /** @internal Connection for proxied observable signal, if any */
    private _proxyConnection: SignalConnection;
}

// NOTE: mixing in required signal methods here for better performance,
// repurposing ObservableValue instances as their own change signals
(<typeof Signal><any>ObservableValue.prototype)._connect = Signal._connect;
(<typeof Signal><any>ObservableValue.prototype).connect = Signal.connect;
(<typeof Signal><any>ObservableValue.prototype).connectOnce = Signal.connectOnce;
(<typeof Signal><any>ObservableValue.prototype).emitSync = Signal.emitSync;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** Create a (single) observable that holds the return value of the given function, re-evaluated (when subscribed to) whenever one of the observable values used in the getter function change, *or* (also when not subscribed to) when `ObservableValue#value` is read after one of the observables used in the getter function (may have) changed its value; note that getters *should* be pure functions without side effects, creating or setting other observables from the getter will result in an error */
export function observe<T>(f: () => T): ObservableValue<T>;

/** Encapsulate given promise as an observable value that is set when the promise resolves; if the promise is already resolved, the observable value is set to the promise's value immediately; if or when the promise is rejected, the error is stored and will be thrown when trying to obtain the observable value */
export function observe<T>(promise: PromiseLike<T>): ObservableValue<T>;

/** Returns a new ObservableArray with elements copied from given array; (same as `ObservableArray.fromArray`; does not observe values of a given `ObservableArray`, see `observeArray` instead) */
export function observe<T>(obj: Array<T>): ObservableArray<T>;

/** Returns a new ObservableObject with properties copied from given object; (same as new ObservableObject(...) but with a strongly typed return value) */
export function observe<T extends object>(obj: T): T & ObservableObject;

export function observe(v: any) {
    return (typeof v === "function") ? new ObservableValue(v) :
        (v && typeof v === "object" && typeof v.then === "function") ?
            ObservableValue.fromPromise(v) :
            (v instanceof Array) ?
                ObservableArray.fromArray(v) :
                (v instanceof Object) ?
                    makeObjectObservable(v) :
                    (() => { throw new TypeError() })();
}

/** Invoke given function without recording dependencies on currently evaluating observable values; passes on the `this` value given to this function, returns the function's return value */
export function unobserved<T>(f: ((...args: any[]) => T), ...args: any[]): T;
export function unobserved(this: any, f: Function) {
    var prevWatched = currentWatchedEvaling;
    var prevUnwatched = currentUnwatchedEvaling;
    try {
        currentWatchedEvaling = undefined;
        currentUnwatchedEvaling = undefined;
        return f.apply(this, Array.prototype.slice.call(arguments, 1));
    }
    finally {
        currentWatchedEvaling = prevWatched;
        currentUnwatchedEvaling = prevUnwatched;
    }
}
