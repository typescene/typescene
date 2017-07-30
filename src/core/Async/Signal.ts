import { defer } from "./Defer";
import { Promise } from "./Promise";

// remove cyclical dependency by requiring this from root:
import { ObservableValue } from "./";

/** Flag used to coordinate between handler added by connectOnce, and emitSync method (set when deleted own handler, i.e. emitSync needs to call handler at same index again) */
var _handlerDeletedSelf = false;

/** Variable used by Signal.create to keep track of most specific signal to be emitted */
var _currentSignal: typeof Signal | undefined;

/** Encapsulates a handler connected to a signal */
export interface SignalConnection {
    /** Disconnect the connected handler from this signal */
    disconnect(): void;

    /** True if connection has been disconnected */
    disconnected: boolean;
}

/** Helper function that generates a handler function which looks for a given method on given target */
function makeMethodHandler(method: string, target?: object) {
    if (!target) throw new TypeError("Target is " + target);
    return function () {
        var f = (<any>target)[method];
        if (typeof f !== "function")
            throw new TypeError("Target does not contain method: " + method);
        f.apply(target, arguments);
    }
}

/** Encapsulates a signal that can be used to trigger one or more handlers asynchronously; do _not_ construct `Signal` classes directly, use the static `.create` method to create derived classes which can be instantiated and emitted */
export abstract class Signal<T> {
    /** Create a new emittable signal class with given payload type */
    public static create(): Signal.VoidEmittable;
    public static create<DataT>(): Signal.Emittable<DataT>;
    public static create(): any {
        var Result = class DefinedSignal extends this<any> {
            constructor(value?: any) {
                if (!_currentSignal) _currentSignal = Result;
                super(value, _currentSignal);
                _currentSignal = undefined;
            }
        };
        (<any>Result).$sigNHnd = 0;
        Result.__emittable = true;
        return Result;
    }

    /** [implementation] Create a read-only observable value that contains the last emitted value (initially undefined, only contains a value after the first time this signal is emitted) */
    public static observe() {
        return ObservableValue.fromSignal<any>(<any>this);
    }

    /** [implementation] Add a handler */
    public static connect(callback: any, target?: object) {
        // make handler function if given only a method name
        if (typeof callback === "string")
            callback = makeMethodHandler(callback, target);

        // add handler to the list, return a SignalConnection object
        var connection: SignalConnection = <any>{ disconnected: false };
        connection.disconnect = Signal._connect.call(this, callback, connection);
        return connection;
    }

    /** [implementation] Add a one-time handler */
    public static connectOnce(callback: any, target?: object) {
        // make handler function if given only a method name
        if (typeof callback === "string")
            callback = makeMethodHandler(callback, target);

        // add wrapper to the list, call handler only once
        var called = false, un = Signal._connect.call(this, (data: any, src: any) => {
            if (!called) {
                called = true;
                _handlerDeletedSelf = true;
                un();
                callback(data, src);
            }
        });
    }

    /** @internal Implementation of connect: returns disconnect function [used to speed up connections in other Async classes] */
    public static _connect(callback: (data: any) => any,
        signalConnection?: SignalConnection): () => void {
        // copy all inherited static properties onto this class instance
        // (or initialize re-used object)
        var s = this;
        if (s.$sigSelf !== s) {
            s.$sigSelf = s;
            s.$sigh1 = s.$sigh1, s.$sigh2 = s.$sigh2, s.$sigh3 = s.$sigh3, s.$sigh4 = s.$sigh4;
            s.$sigHnd = s.$sigHnd && s.$sigHnd.slice();
            s.$sigNHnd = s.$sigNHnd || 0;
        }

        // add handler to the list
        switch (s.$sigNHnd++) {
            case 0:
                // call "up" listener to make sure signals get emitted
                s.$sigh1 = callback;
                s.onHandlerConnected && s.onHandlerConnected();
                break;
            case 1: s.$sigh2 = callback; break;
            case 2: s.$sigh3 = callback; break;
            case 3: s.$sigh4 = callback; break;
            default: (s.$sigHnd || (s.$sigHnd = [])).push(callback);
        }
        return () => {
            // remove handler from the list
            if (s.$sigh1 === callback)
                [s.$sigh1, s.$sigh2, s.$sigh3, s.$sigh4] =
                    [s.$sigh2, s.$sigh3, s.$sigh4, s.$sigHnd && s.$sigHnd!.shift()],
                    s.$sigNHnd--;
            else if (s.$sigh2 === callback)
                [s.$sigh2, s.$sigh3, s.$sigh4] =
                    [s.$sigh3, s.$sigh4, s.$sigHnd && s.$sigHnd!.shift()],
                    s.$sigNHnd--;
            else if (s.$sigh3 === callback)
                [s.$sigh3, s.$sigh4] =
                    [s.$sigh4, s.$sigHnd && s.$sigHnd!.shift()],
                    s.$sigNHnd--;
            else if (s.$sigh4 === callback)
                s.$sigh4 = s.$sigHnd && s.$sigHnd!.shift(),
                    s.$sigNHnd--;
            else if (s.$sigNHnd > 4) {
                for (var i = s.$sigHnd!.length - 1; i >= 0; i--) {
                    if (s.$sigHnd![i] === callback) {
                        s.$sigHnd!.splice(i, 1);
                        s.$sigNHnd--;
                        break;
                    }
                }
            }

            // check new length: call "down" listener if none
            if (!s.$sigNHnd && s.onHandlersDisconnected)
                s.onHandlersDisconnected();

            // set disconnected flag
            if (signalConnection) signalConnection.disconnected = true;
        };
    }

    /** [implementation] Remove all handlers */
    public static disconnectAll() {
        // call "down" callback to allow signals to stop for now
        if (this.$sigNHnd) {
            this.$sigh1 = undefined;
            this.$sigh2 = undefined;
            this.$sigh3 = undefined;
            this.$sigh4 = undefined;
            this.$sigHnd = undefined;
            this.$sigNHnd = 0;
            this.onHandlersDisconnected && this.onHandlersDisconnected();
        }
        return this;
    }

    /** [implementation] Returns true if this signal has any handlers */
    public static isConnected() {
        return (this.$sigNHnd > 0);
    }

    /** @internal Invoke all handlers synchronously, without creating a Signal instance at all; exceptions in handlers are NOT caught here */
    public static emitSync(data: any) {
        if (this.$sigNHnd) {
            _handlerDeletedSelf = false;
            while (this.$sigh1 && (this.$sigh1.call(undefined, data),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this.$sigh2 && (this.$sigh2.call(undefined, data),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this.$sigh3 && (this.$sigh3.call(undefined, data),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            while (this.$sigh4 && (this.$sigh4.call(undefined, data),
                _handlerDeletedSelf)) _handlerDeletedSelf = false;
            var handlers = this.$sigHnd;
            if (handlers) {
                for (var i = 0; i < handlers.length; i++) {
                    while (handlers[i] &&
                        (handlers[i].call(undefined, data),
                            _handlerDeletedSelf))
                        _handlerDeletedSelf = false;
                }
            }
        }
    }

    /** @internal Invoke all handlers asynchronously, possibly without creating a Signal instance at all; exceptions in handlers are NOT caught here */
    public static emit(data: any) {
        if (!this.__emittable) throw new TypeError;
        if (this.$sigNHnd) {
            if (this.$sigh1) defer(this.$sigh1.bind(this, data));
            if (this.$sigh2) defer(this.$sigh2.bind(this, data));
            if (this.$sigh3) defer(this.$sigh3.bind(this, data));
            if (this.$sigh4) defer(this.$sigh4.bind(this, data));
            var handlers = this.$sigHnd;
            if (handlers) {
                for (var i = 0, len = handlers.length; i < len; i++)
                    handlers[i] && defer(handlers[i].bind(this, data));
            }
        }
    }

    /** Static method that is called synchronously when a first handler is connected (and when a new handler is connected after all had been disconnected); override this in a signal base class, e.g. to add a delayed initialization method */
    protected static onHandlerConnected?: () => void;

    /** Static method that is called synchronously when no more handlers are connected; override this in a signal base class, e.g. to add a delayed deallocation method */
    protected static onHandlersDisconnected?: () => void;

    // NOTE on naming below: the ObservableValue class adopts the static methods
    // of the Signal class and re-uses its own instance, with $sig properties
    // below used by the Signal methods.

    /** @internal Handler function 1 (performance optimization) */
    private static $sigh1?: (data: any) => any;
    /** @internal Handler function 2 (performance optimization) */
    private static $sigh2?: (data: any) => any;
    /** @internal Handler function 3 (performance optimization) */
    private static $sigh3?: (data: any) => any;
    /** @internal Handler function 4 (performance optimization) */
    private static $sigh4?: (data: any) => any;
    /** @internal All other handler functions */
    private static $sigHnd?: ((data: any) => any)[];
    /** @internal Number of handlers */
    private static $sigNHnd = 0;

    /** @internal Class reference, set when connecting a first handler, used to prevent mixing properties from base and derived classes; doing so would cause problems with inherited static members above */
    private static $sigSelf: typeof Signal;

    /** @internal Set to true by `.create`, if this property is not defined then this signal should not be constructable/emittable */
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
        var nHandlers = (<typeof Signal>this.constructor).$sigNHnd;
        if (!nHandlers) return this;

        var handler1 = (<typeof Signal>this.constructor).$sigh1;
        var handler2 = (<typeof Signal>this.constructor).$sigh2;
        var handler3 = (<typeof Signal>this.constructor).$sigh3;
        var handler4 = (<typeof Signal>this.constructor).$sigh4;
        var handlers = (<typeof Signal>this.constructor).$sigHnd;
        var data = this._data;
        if (!noResults) {
            // intialize an array of Promises
            var results = this._results = [handler1 ?
                Promise.defer(handler1.bind(this, data)) :
                Promise.resolve(undefined)];
            if (nHandlers > 1) results.push(handler2 ?
                Promise.defer(handler2.bind(this, data)) :
                Promise.resolve(undefined));
            if (nHandlers > 2) results.push(handler3 ?
                Promise.defer(handler3.bind(this, data)) :
                Promise.resolve(undefined));
            if (nHandlers > 3) results.push(handler4 ?
                Promise.defer(handler4.bind(this, data)) :
                Promise.resolve(undefined));
            if (nHandlers > 4)
                handlers!.forEach(f => results.push(f ?
                    Promise.defer(f.bind(this, data)) :
                    Promise.resolve(undefined)));
        }
        else {
            // no need to capture results, schedule plain handlers
            defer(handler1!.bind(this, data));
            if (nHandlers > 1) defer(handler2!.bind(this, data));
            if (nHandlers > 2) defer(handler3!.bind(this, data));
            if (nHandlers > 3) defer(handler4!.bind(this, data));
            if (nHandlers > 4) handlers!.forEach(f => f && defer(f.bind(this, data)));
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
    /** Type definition for a callable (emittable) signal *class*; matches the result of `.create` with the same type parameter */
    export interface Emittable<T> {
        /** Instantiate a signal with given value, ready to be emitted */
        new (data: T): Signal<T>;
        /** Emit a signal with given value; does not instantiate this class unless there are actually handlers connected to it */
        (data: T): void;
        /** Add a handler to be invoked when this signal is emitted; returns an encapsulation of the connection with a disconnect method */
        connect(handler: (data: T) => any): SignalConnection;
        /** Add a handler to be invoked when this signal is emitted: a method with given name on given target object (resolved only when needed); returns an encapsulation of the connection with a disconnect method */
        connect(method: string, target: object): SignalConnection;
        /** Add a handler to be invoked the next time this signal is emitted */
        connectOnce(handler: (data: T) => any): void;
        /** Add a handler to be invoked the next time this signal is emitted: a method with given name on given target object (resolved only when needed) */
        connectOnce(method: string, target: object): void;
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
        _connect(callback: (data: any) => any): () => void;
    }

    /** Type definition for a callable (emittable) signal *class*; matches the result of `.create` without a type parameter */
    export interface VoidEmittable {
        /** Instantiate a signal, ready to be emitted */
        new(): Signal<void>;
        /** Emit a signal; does not instantiate this class unless there are actually handlers connected to it */
        (): void;
        /** Add a handler to be invoked when this signal is emitted; returns an encapsulation of the connection with a disconnect method */
        connect(handler: () => any): SignalConnection;
        /** Add a handler to be invoked when this signal is emitted: a method with given name on given target object (resolved only when needed); returns an encapsulation of the connection with a disconnect method */
        connect(method: string, target: object): SignalConnection;
        /** Add a handler to be invoked the next time this signal is emitted */
        connectOnce(handler: () => any): void;
        /** Add a handler to be invoked the next time this signal is emitted: a method with given name on given target object (resolved only when needed) */
        connectOnce(method: string, target: object): void;
        /** Remove all handlers */
        disconnectAll(): this;
        /** Returns true if this signal has any handlers connected to it */
        isConnected(): boolean;
    }
}

/** Signal that is emitted for all exceptions that were unhandled during async execution; a custom handler may be added here, the default handler just logs a warning message to the console; to disable this behavior for specific errors, set error.message to a blank string */
export const UnhandledException = Signal.create<Error>();

// hook up default behavior:
UnhandledException._connect((error: Error) => {
    try {
        error && error.message && console && (console.warn || console.log)(
            "Unhandled exception in asynchronous code - ", error);
    }
    catch (all) { }
});
