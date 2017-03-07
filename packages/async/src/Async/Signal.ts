import { defer } from "./Defer";
import { Promise } from "./Promise";

// remove cyclical dependency by requiring this from root:
import { ObservableValue } from "./";

/** Flag used to coordinate between handler added by connectOnce, and emitSync method (set when deleted own handler, i.e. emitSync needs to call handler at same index again) */
var _handlerDeletedSelf = false;

/** Encapsulates a handler connected to a signal */
export interface SignalConnection {
    /** Disconnect the connected handler from this signal */
    disconnect(): void;

    /** True if connection has been disconnected */
    disconnected: boolean;
}

/** Helper function that generates a handler function which looks for a given method on given target */
function makeMethodHandler(method: string, target?: {}) {
    if (!target) throw new TypeError("Target is " + target);
    return function () {
        var f = target[method];
        if (typeof f !== "function")
            throw new TypeError("Target does not contain method: " + method);
        f.call(target, arguments);
    }
}

/** Encapsulates a signal that can be used to trigger one or more handlers asynchronously; do _not_ construct `Signal` classes directly, use `defineSignal` to create derived classes which can be instantiated and emitted */
export abstract class Signal<T> {
    /** [implementation] Create a read-only observable value that contains the last emitted value (initially undefined, only contains a value after the first time this signal is emitted) */
    public static observe() {
        return ObservableValue.fromSignal(<any>this);
    }

    /** [implementation] Add a handler */
    public static connect(callback: any, target?: {}) {
        // make handler function if given only a method name
        if (typeof callback === "string")
            callback = makeMethodHandler(callback, target);

        // add handler to the list, return a SignalConnection object
        var connection: SignalConnection = <any>{ disconnected: false };
        connection.disconnect = Signal._connect.call(this, callback, connection);
        return connection;
    }

    /** [implementation] Add a one-time handler */
    public static connectOnce(callback: any, target?: {}) {
        // make handler function if given only a method name
        if (typeof callback === "string")
            callback = makeMethodHandler(callback, target);

        // add wrapper to the list, call handler only once
        var called = false, un = Signal._connect.call(this, (data, src) => {
            if (!called) {
                called = true;
                _handlerDeletedSelf = true;
                un();
                callback(data, src);
            }
        });
    }

    /** @internal Implementation of connect: returns disconnect function [used to speed up connections in other Async classes] */
    public static _connect(callback: (data: any, source: typeof Signal) => any,
        signalConnection?: SignalConnection): () => void {
        // copy all inherited static properties onto this class instance
        var s = this;
        if (s._self !== s) {
            s._self = s;
            s._h1 = s._h1, s._h2 = s._h2, s._h3 = s._h3, s._h4 = s._h4;
            s._hn = s._hn && s._hn.slice();
            s._nHandlers = s._nHandlers;
        }

        // add handler to the list
        switch (s._nHandlers++) {
            case 0:
                // call "up" listener to make sure signals get emitted
                s._h1 = callback;
                s.onHandlerConnected && s.onHandlerConnected();
                break;
            case 1: s._h2 = callback; break;
            case 2: s._h3 = callback; break;
            case 3: s._h4 = callback; break;
            default: (s._hn || (s._hn = [])).push(callback);
        }
        return () => {
            // remove handler from the list
            if (s._h1 === callback)
                [s._h1, s._h2, s._h3, s._h4] =
                    [s._h2, s._h3, s._h4, s._hn && s._hn!.shift()],
                    s._nHandlers--;
            else if (s._h2 === callback)
                [s._h2, s._h3, s._h4] =
                    [s._h3, s._h4, s._hn && s._hn!.shift()],
                    s._nHandlers--;
            else if (s._h3 === callback)
                [s._h3, s._h4] =
                    [s._h4, s._hn && s._hn!.shift()],
                    s._nHandlers--;
            else if (s._h4 === callback)
                s._h4 = s._hn && s._hn!.shift(),
                    s._nHandlers--;
            else if (s._nHandlers > 4) {
                for (var i = s._hn!.length - 1; i >= 0; i--) {
                    if (s._hn![i] === callback) {
                        s._hn!.splice(i, 1);
                        s._nHandlers--;
                        break;
                    }
                }
            }

            // check new length: call "down" listener if none
            if (!s._nHandlers && s.onHandlersDisconnected)
                s.onHandlersDisconnected();

            // set disconnected flag
            if (signalConnection) signalConnection.disconnected = true;
        };
    }

    /** [implementation] Remove all handlers */
    public static disconnectAll() {
        // call "down" callback to allow signals to stop for now
        if (this._nHandlers) {
            this._h1 = undefined;
            this._h2 = undefined;
            this._h3 = undefined;
            this._h4 = undefined;
            this._hn = undefined;
            this._nHandlers = 0;
            this.onHandlersDisconnected && this.onHandlersDisconnected();
        }
        return this;
    }

    /** [implementation] Returns true if this signal has any handlers */
    public static isConnected() {
        return (this._nHandlers > 0);
    }

    /** @internal Invoke all handlers synchronously, without creating a Signal instance at all; exceptions in handlers are NOT caught here */
    public static emitSync(data: any) {
        if (this._nHandlers) {
            _handlerDeletedSelf = false;
            while (this._h1 && (this._h1.call(undefined, data, this),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this._h2 && (this._h2.call(undefined, data, this),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this._h3 && (this._h3.call(undefined, data, this),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this._h4 && (this._h4.call(undefined, data, this),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            var handlers = this._hn;
            if (handlers) {
                for (var i = 0; i < handlers.length; i++) {
                    while (handlers[i] &&
                        (handlers[i].call(undefined, data, this),
                            _handlerDeletedSelf))
                        _handlerDeletedSelf = false;
                }
            }
        }
    }

    /** @internal Invoke all handlers asynchronously, possibly without creating a Signal instance at all; exceptions in handlers are NOT caught here */
    public static emit(data: any) {
        if (!this.__emittable) throw new TypeError;
        if (this._nHandlers) {
            var args = [data, this];
            if (this._h1) defer(this._h1, args);
            if (this._h2) defer(this._h2, args);
            if (this._h3) defer(this._h3, args);
            if (this._h4) defer(this._h4, args);
            var handlers = this._hn;
            if (handlers) {
                for (var i = 0, len = handlers.length; i < len; i++)
                    handlers[i] && defer(handlers[i], args);
            }
        }
    }

    /** Static method that is called synchronously when a first handler is connected (and when a new handler is connected after all had been disconnected); override this in a signal base class, e.g. to add a delayed initialization method */
    protected static onHandlerConnected?: () => void;

    /** Static method that is called synchronously when no more handlers are connected; override this in a signal base class, e.g. to add a delayed deallocation method */
    protected static onHandlersDisconnected?: () => void;

    /** @internal Handler function 1 (performance optimization) */
    private static _h1?: (data: any, source: typeof Signal) => any;
    /** @internal Handler function 2 (performance optimization) */
    private static _h2?: (data: any, source: typeof Signal) => any;
    /** @internal Handler function 3 (performance optimization) */
    private static _h3?: (data: any, source: typeof Signal) => any;
    /** @internal Handler function 4 (performance optimization) */
    private static _h4?: (data: any, source: typeof Signal) => any;
    /** @internal All other handler functions */
    private static _hn?: ((data: any, source: typeof Signal) => any)[];
    /** @internal Number of handlers */
    private static _nHandlers = 0;

    /** @internal Class reference, set when connecting a first handler, used to prevent mixing properties from base and derived classes; doing so would cause problems with inherited static members above */
    private static _self: typeof Signal;

    /** @internal Set to true by `defineSignal`, if this property is not defined then this signal should not be constructable/emittable */
    public static __emittable?: boolean;

    /** Create a signal with given payload data, ready to be emitted */
    constructor(data: T);
    /** @internal Base class constructor */
    constructor(data: T, self?: typeof Signal);
    constructor(data: T, self?: typeof Signal) {
        if (!(this instanceof Signal)) {
            // called as a function, not a constructor: emit directly
            self && self.emit.call(self, data, true);
        }
        else {
            if (!(<any>this.constructor).__emittable) throw new TypeError;
            this._data = data;
        }
    }

    /** Invoke all handlers and capture promises of their return values in .results (unless argument is true); works only once; returns this */
    public emit(noResults?: boolean) {
        if (this._emitted) return this;
        this._emitted = true;
        var nHandlers = (<typeof Signal>this.constructor)._nHandlers;
        if (!nHandlers) return this;

        var handler1 = (<typeof Signal>this.constructor)._h1;
        var handler2 = (<typeof Signal>this.constructor)._h2;
        var handler3 = (<typeof Signal>this.constructor)._h3;
        var handler4 = (<typeof Signal>this.constructor)._h4;
        var handlers = (<typeof Signal>this.constructor)._hn;
        var args = [this._data, this.constructor];
        if (!noResults) {
            // intialize an array of Promises
            var results = this._results = [handler1 ?
                Promise.defer(handler1, args) :
                Promise.resolve(undefined)];
            if (nHandlers > 1) results.push(handler2 ?
                Promise.defer(handler2, args) :
                Promise.resolve(undefined));
            if (nHandlers > 2) results.push(handler3 ?
                Promise.defer(handler3, args) :
                Promise.resolve(undefined));
            if (nHandlers > 3) results.push(handler4 ?
                Promise.defer(handler4, args) :
                Promise.resolve(undefined));
            if (nHandlers > 4)
                handlers!.forEach(f => results.push(f ?
                    Promise.defer(f, args) :
                    Promise.resolve(undefined)));
        }
        else {
            // no need to capture results, schedule plain handlers
            defer(handler1!, args);
            if (nHandlers > 1) defer(handler2!, args);
            if (nHandlers > 2) defer(handler3!, args);
            if (nHandlers > 3) defer(handler4!, args);
            if (nHandlers > 4) handlers!.forEach(f => f && defer(f, args));
        }
        if (this._onEmit) this._onEmit(true);
        return this;
    }

    /** Invoke given callback(s) with return values of all handlers, or any exception that occurred during execution of all handlers; returns a Promise that resolves to the return value of the callback(s) itself */
    public then<O>(onFulfilled?: (results: any[]) => O,
        onRejected?: (error: Error) => O) {
        if (!this._promise) {
            if (!this._emitted)
                this._promise = new Promise<boolean>(r => { this._onEmit = r })
                    .then(() => Promise.all(this.results));
            else
                this._promise = Promise.all(this.results);
        }
        return this._promise.then(onFulfilled, onRejected);
    }

    /** Catch errors that occur during execution of all handlers; returns a Promise that resolves to the return value of the callback itself */
    public catch<O>(onRejected?: (error: Error) => O) {
        return this.then(undefined, onRejected);
    }

    /** Array of Promises that resolve to return values of all handlers */
    public get results() {
        return this._results || [];
    }

    /** The payload data for this signal instance */
    public get data() { return this._data }

    /** @internal */
    private _data: T;
    /** @internal */
    private _emitted?: boolean;
    /** @internal */
    private _results: Promise<any>[];
    /** @internal */
    private _promise: Promise<any[]>;
    /** @internal */
    private _onEmit: (emitted: boolean) => void;
}

export namespace Signal {
    /** Type definition for a callable (emittable) signal *class*; matches the result of `defineSignal`; the type parameters represent handler function arguments: signal payload, and emitted signal type */
    export interface Emittable<T, SignalClassT extends typeof Signal> {
        /** Instantiate a signal with given value, ready to be emitted */
        new (data: T): Signal<T>;
        /** Emit a signal with given value; does not instantiate this class unless there are actually handlers connected to it */
        (data?: T): void;
        /** Add a handler to be invoked when this signal is emitted; returns an encapsulation of the connection with a disconnect method */
        connect(handler: (data: T, source: SignalClassT) => any): SignalConnection;
        /** Add a handler to be invoked when this signal is emitted: a method with given name on given target object (resolved only when needed); returns an encapsulation of the connection with a disconnect method */
        connect(method: string, target: {}): SignalConnection;
        /** Add a handler to be invoked the next time this signal is emitted */
        connectOnce(handler: (data: T, source: SignalClassT) => any): void;
        /** Add a handler to be invoked the next time this signal is emitted: a method with given name on given target object (resolved only when needed) */
        connectOnce(method: string, target: {}): void;
        /** Remove all handlers */
        disconnectAll(): this;
        /** Returns true if this signal has any handlers connected to it */
        isConnected(): boolean;
        /** Create a read-only observable value that contains the last emitted value (initially undefined, only contains a value after the first time this signal is emitted) */
        observe(): ObservableValue<T>;
        /** @internal Invoke all handlers synchronously, without creating a Signal instance at all; exceptions in handlers are NOT caught here */
        emitSync(data: T): void;
        /** @internal Schedule all handlers, possibly without creating a Signal instance at all */
        emit(data: T): void;
        /** @internal Implementation of connect */
        _connect(callback: (data: any, source: SignalClassT) => any): () => void;
    }
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** Create a new emittable signal class that derives directly from `Signal`, with given payload type */
export function defineSignal<T>(): Signal.Emittable<T, typeof Signal>;

/** Create a new emittable signal class that derives from given base class (which must derive from `Signal`), and copy given static properties onto the resulting class */
export function defineSignal<SignalT extends typeof Signal, T>(
    Base: SignalT & { new (...args): { data: T } },
    properties?: {}):
    SignalT & Signal.Emittable<T, SignalT>;

export function defineSignal(Base = Signal, props?: any): any {
    var Result = class DefinedSignal extends Base<any> {
        constructor(value?: any) {
            if (!_currentSignal) _currentSignal = Result;
            super(value, _currentSignal);
            _currentSignal = undefined;
        }
    };
    for (var p in props) Result[p] = props[p];
    (<any>Result)._nHandlers = 0;
    Result.__emittable = true;
    return Result;
}

/** Variable used by defineSignal to keep track of most specific signal to be emitted */
var _currentSignal: typeof Signal | undefined;

/** Signal that is triggered with exceptions that were unhandled during async execution; a custom handler may be added here, the default handler just writes a warning message to the console; to disable this behavior for specific errors, set error.message to a blank string */
export const UnhandledException = defineSignal<Error>();

// hook up default behavior:
UnhandledException._connect((error: Error) => {
    try {
        error && error.message && console && (console.warn || console.log)(
            "Unhandled exception in asynchronous code - ", error);
    }
    catch (all) { }
});
