module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	// re-export Async module in its entirety
	var _Async = __webpack_require__(1);
	var typescene_async_1 = __webpack_require__(1);
	exports.Async = _Async;
	/** Shortcut to @Async.observable decorator */
	exports.observable = typescene_async_1.observable;
	/** Shortcut to Async.observe function */
	exports.observe = typescene_async_1.observe;
	// export UI module both as default and as UI
	var _UI = __webpack_require__(2);
	exports.UI = _UI;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = exports.UI;


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports =
	/******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};

	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {

	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;

	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};

	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;

	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}


	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;

	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;

	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";

	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		function __export(m) {
		    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
		}
		// export all properties from main module
		__export(__webpack_require__(1));
		// export main module itself both as default and as Async
		var _Async = __webpack_require__(1);
		exports.Async = _Async;
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.default = exports.Async;


	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		function __export(m) {
		    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
		}
		var Signal_1 = __webpack_require__(2);
		/** Number of deferred functions to run in one go */
		var MAX_RUN_DEFERRED = 100;
		/** Queue of functions to execute when idle (deferred functions) */
		var deferred = [];
		var deferredArgs = [];
		/** Current setTimeout ID, if > 0 */
		var deferTimeout = 0;
		/** Run a batch of deferred functions */
		function _runDeferred() {
		    var i = 0;
		    // run maximum number of deferred functions
		    while (deferred.length && i++ < MAX_RUN_DEFERRED) {
		        try {
		            deferred.shift().apply(undefined, deferredArgs.shift());
		        }
		        catch (err) {
		            new Signal_1.UnhandledException(err).emit(true);
		        }
		    }
		    // reschedule if necessary
		    if (deferred.length) {
		        if (!deferTimeout)
		            deferTimeout = setTimeout(_runDeferred, 0);
		    }
		    else if (deferTimeout) {
		        clearTimeout(deferTimeout);
		        deferTimeout = 0;
		    }
		}
		/** Execute given function only when idle */
		function defer(f, args) {
		    deferred.push(f);
		    deferredArgs.push(args);
		    if (!deferTimeout)
		        deferTimeout = setTimeout(_runDeferred, 0);
		}
		exports.defer = defer;
		/** Run a batch of deferred functions; returns true if there are still more
		  * deferred functions in the queue */
		function yieldAll() {
		    _runDeferred();
		    return (deferred.length > 0);
		}
		exports.yieldAll = yieldAll;
		// export all other modules in the Async namespace
		__export(__webpack_require__(2));
		__export(__webpack_require__(3));
		__export(__webpack_require__(4));
		__export(__webpack_require__(5));
		__export(__webpack_require__(6));


	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		var __extends = (this && this.__extends) || function (d, b) {
		    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
		    function __() { this.constructor = d; }
		    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
		var Async_1 = __webpack_require__(1);
		var Promise_1 = __webpack_require__(3);
		/** A static class for a signal that can be used to trigger one or more
		  * handlers asynchronously (use CustomSignal to create classes) */
		var Signal = (function () {
		    /** Create a signal with given data */
		    function Signal(_data) {
		        this._data = _data;
		        // nothing here
		    }
		    /** Add a handler to be invoked when this signal is emitted;
		      * returns an encapsulation of the connection with a disconnect method */
		    Signal.connect = function (callback) {
		        var _this = this;
		        if (!this._handlers)
		            this._handlers = [];
		        // add handler to the list
		        if (this._handlers.push(callback) === 1) {
		            // call "up" listener to make sure signals get emitted
		            this._onUp && this._onUp();
		        }
		        // return a SignalConnection object
		        var connection = {
		            disconnect: function () {
		                connection.disconnected = true;
		                // remove handler from the list, and check new length
		                if (_this._handlers && !(_this._handlers =
		                    _this._handlers.filter(function (f) { return f !== callback; })).length) {
		                    // call "down" listener to allow signals to stop for now
		                    _this._onDown && _this._onDown();
		                }
		            },
		            disconnected: false
		        };
		        return connection;
		    };
		    /** Add a handler to be invoked once when this signal is emitted;
		      * returns an encapsulation of the connection with a disconnect method */
		    Signal.connectOnce = function (callback) {
		        var called = false;
		        var connection = this.connect(function (data) {
		            if (!called) {
		                called = true;
		                connection.disconnect();
		                callback.call(undefined, data);
		            }
		        });
		        return connection;
		    };
		    /** Remove all handlers; returns this */
		    Signal.disconnectAll = function () {
		        var oldLength = this._handlers && this._handlers.length;
		        this._handlers = null;
		        // call "down" callback to allow signals to stop for now
		        if (oldLength)
		            this._onDown && this._onDown();
		        return this;
		    };
		    /** Returns true if this signal has any handlers */
		    Signal.isConnected = function () {
		        return !!(this._handlers && this._handlers.length);
		    };
		    /** Invoke all handlers and capture promises of their return values in
		      * .results; works only once; returns this */
		    Signal.prototype.emit = function (noResults) {
		        var _this = this;
		        if (this._emitted)
		            return this;
		        this._emitted = true;
		        var handlers = this.constructor._handlers;
		        if (handlers && !noResults) {
		            // intialize an array of Promises
		            this._results = handlers.map(function (f) {
		                return (f ? Promise_1.Promise.defer(f, [_this._data]) : Promise_1.Promise.resolve(undefined));
		            });
		        }
		        else {
		            // no need to capture results, schedule plain handlers
		            handlers && handlers.forEach(function (f) { return f && Async_1.defer(f, [_this._data]); });
		        }
		        if (this._onEmit)
		            this._onEmit(true);
		        return this;
		    };
		    /** Invoke all handlers synchronously and return their return values,
		      * also sets .results; works only once */
		    Signal.prototype.emitSync = function () {
		        var _this = this;
		        if (this._emitted)
		            throw new Error("Signal instance already emitted");
		        this._emitted = true;
		        // run all handlers and return results
		        var handlers = this.constructor._handlers;
		        if (handlers) {
		            var results = this._syncResults =
		                handlers.map(function (f) { return (f ? f(_this._data) : undefined); });
		        }
		        else {
		            results = [];
		            this._results = [];
		        }
		        if (this._onEmit)
		            this._onEmit(true);
		        return results;
		    };
		    /** Invoke given callback(s) with return values of all handlers, or
		      * any exception that occurred during execution of all handlers;
		      * returns a Promise that resolves to the return value of the
		      * callback(s) itself */
		    Signal.prototype.then = function (onFulfilled, onRejected) {
		        var _this = this;
		        if (!this._promise) {
		            if (!this._emitted)
		                this._promise = new Promise_1.Promise(function (r) { _this._onEmit = r; })
		                    .then(function () { return Promise_1.Promise.all(_this.results); });
		            else
		                this._promise = Promise_1.Promise.all(this.results);
		        }
		        return this._promise.then(onFulfilled, onRejected);
		    };
		    /** Catch errors that occur during execution of all handlers;
		      * returns a Promise that resolves to the return value of the
		      * callback itself */
		    Signal.prototype.catch = function (onRejected) {
		        return this.then(undefined, onRejected);
		    };
		    Object.defineProperty(Signal.prototype, "results", {
		        /** Array of Promises that resolve to return values of all handlers */
		        get: function () {
		            if (!this._results) {
		                this._results = this._syncResults ?
		                    this._syncResults.map(function (value) { return Promise_1.Promise.resolve(value); }) :
		                    [];
		            }
		            return this._results;
		        },
		        enumerable: true,
		        configurable: true
		    });
		    return Signal;
		}());
		exports.Signal = Signal;
		/** Create a custom Signal class with given base class, and given handlers to
		  * be invoked immediately (not async) when a first handler is connected,
		  * or all handlers are disconnected (resp.) */
		function defineSignal(Base, onUp, onDown) {
		    if (Base === void 0) { Base = Signal; }
		    var constructorToken = {};
		    var Result = function Signal(_token) {
		        if (!(this instanceof Result)) {
		            // called as a function, not a constructor: emit directly
		            if (Result.isConnected) {
		                var result = new Result(constructorToken);
		                Base.apply(result, arguments);
		                result.emit(true);
		            }
		        }
		        else if (_token !== constructorToken) {
		            // called as a constructor, just call base constructor
		            Base.apply(this, arguments);
		        }
		    };
		    // copy static methods/members and apply prototype
		    for (var id in Base)
		        if (Base.hasOwnProperty(id))
		            Result[id] = Base[id];
		    Result.prototype = Object.create(Base.prototype);
		    Result.prototype.constructor = Result;
		    // clear all handlers for this class object and return the class
		    Result._handlers = null;
		    Result._onUp = onUp;
		    Result._onDown = onDown;
		    return Result;
		}
		exports.defineSignal = defineSignal;
		/** Signal that is triggered with exceptions that were unhandled during async
		  * execution; a custom handler may be added here, default handler just
		  * writes a warning message to the console; to disable this behavior for
		  * specific errors, set error.message to a blank string */
		var UnhandledException = (function (_super) {
		    __extends(UnhandledException, _super);
		    function UnhandledException() {
		        _super.apply(this, arguments);
		    }
		    return UnhandledException;
		}(Signal));
		exports.UnhandledException = UnhandledException;
		UnhandledException.connect(function (error) {
		    try {
		        error && error.message && console && (console.warn || console.log)("Unhandled exception in asynchronous code - ", error);
		    }
		    catch (all) { }
		});


	/***/ },
	/* 3 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		var Async_1 = __webpack_require__(1);
		var Signal_1 = __webpack_require__(2);
		/** Represents a value to be resolved at any time in the future */
		var Promise = (function () {
		    function Promise(executor) {
		        this._isResolved = false;
		        this._isRejected = false;
		        this._Resolve = Signal_1.defineSignal();
		        this._Reject = Signal_1.defineSignal();
		        executor && this._resolveWith(executor);
		    }
		    /** Delay the execution of a callback but return a promise for its result */
		    Promise.delay = function (f, ms, args) {
		        var result = new Promise();
		        // set a timer and run all deferred functions right away (e.g. .then(...))
		        setTimeout(function () {
		            result._resolveWith(function (r) { return r(f.apply(undefined, args)); });
		            Async_1.yieldAll();
		        }, ms);
		        return result;
		    };
		    /** Return a promise that will be resolved after a delay */
		    Promise.sleep = function (ms, value) {
		        return Promise.delay(function () { return value; }, ms);
		    };
		    /** Defer the execution of a callback but return a promise for its result */
		    Promise.defer = function (f, args) {
		        var result = new Promise();
		        Async_1.defer(function () { result._resolveWith(function (r) { return r(f.apply(undefined, args)); }); });
		        return result;
		    };
		    /** Return a resolved promise */
		    Promise.resolve = function (value) {
		        var result = new Promise();
		        result._resolve(value);
		        return result;
		    };
		    /** Return a rejected promise */
		    Promise.reject = function (error) {
		        var result = new Promise();
		        result._reject(error);
		        return result;
		    };
		    /** Return a promise that is fulfilled when all given promises are fulfilled
		      * and is immediately rejected when one of the promises is rejected */
		    Promise.all = function (promises) {
		        var result = new Promise();
		        var values = [];
		        var left = promises.length;
		        // fulfill promise if not rejected before
		        function fulfill() {
		            !result._isRejected && result._resolve(values);
		        }
		        // wait for each given promise
		        promises.forEach(function (p, i) {
		            p.then(function (value) {
		                values[i] = value;
		                --left || fulfill();
		            }, function (error) {
		                result._reject(error);
		            });
		        });
		        // fulfill already if no promises given
		        !left && fulfill();
		        return result;
		    };
		    /** Return a promise that is resolved or rejected exactly like the
		      * first of the given promises that is resolved or rejected */
		    Promise.race = function (promises) {
		        var result = new Promise();
		        promises.forEach(function (p, i) {
		            p.then(function (value) { return result._resolve(value); }, function (error) { return result._reject(error); });
		        });
		        return result;
		    };
		    /** Run one of the callbacks as soon as the promise is fulfilled or rejected */
		    Promise.prototype.then = function (onFulfilled, onRejected) {
		        var _this = this;
		        var result = new Promise();
		        if (this._isResolved) {
		            // if already fulfilled, schedule call to onFulfilled or fulfill now
		            if (onFulfilled)
		                Async_1.defer(function () { result._resolveWith(function (r) { return r(onFulfilled(_this._value)); }); });
		            else
		                result._resolve(this._value);
		        }
		        else if (this._isRejected) {
		            // if already rejected, schedule call to onRejected or reject now
		            // (rejections are deferred to allow handlers to connect before the
		            // UnhandledException is emitted)
		            if (onRejected)
		                Async_1.defer(function () { result._resolveWith(function (r) { return r(onRejected(_this._error)); }); });
		            else
		                Async_1.defer(function () { result._reject(_this._error); });
		        }
		        else {
		            // fulfill result when ready
		            if (onFulfilled) {
		                this._Resolve.connect(function (v) {
		                    return result._resolveWith(function (r) { return r(onFulfilled(v)); });
		                });
		            }
		            // handle rejections
		            if (onRejected) {
		                this._Reject.connect(function (v) {
		                    return result._resolveWith(function (r) { return r(onRejected(v)); });
		                });
		            }
		            else {
		                // pass on rejections if no handler defined
		                this._Reject.connect(function (v) { return result._reject(v); });
		            }
		        }
		        // always return a promise with the result of onFulfilled OR onRejected
		        return result;
		    };
		    /** Alternative method to catch rejections */
		    Promise.prototype.catch = function (onRejected) {
		        return this.then(undefined, onRejected);
		    };
		    /** Resolve the promise with a value, or (future) result of a promise */
		    Promise.prototype._resolve = function (value) {
		        var _this = this;
		        if (value instanceof Promise) {
		            // wait for promise to be resolved and recurse
		            value.then(function (v) { return _this._resolve(v); }, function (e) { return _this._reject(e); });
		        }
		        else if (!this._isResolved && !this._isRejected) {
		            // set status and schedule handler chain (if any)
		            this._isResolved = true;
		            this._value = value;
		            new (this._Resolve)(value).emit();
		        }
		    };
		    /** Run a function that may resolve or reject the promise */
		    Promise.prototype._resolveWith = function (executor) {
		        var _this = this;
		        try {
		            // call resolver function with callback for resolving this promise
		            executor(function (v) { return _this._resolve(v); }, function (e) { return _this._reject(e); });
		        }
		        catch (e) {
		            // oops, caught an exception, now reject this promise
		            this._reject(e);
		        }
		    };
		    /** Reject the promise because an error occurred */
		    Promise.prototype._reject = function (error) {
		        // set status and schedule handler chain (if any)
		        if (!this._isResolved && !this._isRejected) {
		            this._isRejected = true;
		            this._error = error;
		            if (this._Reject.isConnected())
		                new (this._Reject)(error).emit();
		            else
		                new Signal_1.UnhandledException(error).emit();
		        }
		    };
		    return Promise;
		}());
		exports.Promise = Promise;
		/** Return a promise that will be resolved after a delay */
		exports.sleep = Promise.sleep;


	/***/ },
	/* 4 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		var __extends = (this && this.__extends) || function (d, b) {
		    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
		    function __() { this.constructor = d; }
		    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
		var Async_1 = __webpack_require__(1);
		var Promise_1 = __webpack_require__(3);
		var Signal_1 = __webpack_require__(2);
		var ObservableArray_1 = __webpack_require__(5);
		/** Watched observable value currently evaluating, if any;
		  * used to connect dependencies through signals */
		var currentWatchedEvaling = null;
		/** Unwatched observable value currently evaluating, if any;
		  * used to collect dependencies for dirty checking */
		var currentUnwatchedEvaling = null;
		var ObservableValueSignal = (function (_super) {
		    __extends(ObservableValueSignal, _super);
		    function ObservableValueSignal() {
		        _super.apply(this, arguments);
		    }
		    return ObservableValueSignal;
		}(Signal_1.Signal));
		exports.ObservableValueSignal = ObservableValueSignal;
		/** Represents an observable value */
		var ObservableValue = (function () {
		    function ObservableValue(getter, setter) {
		        var _this = this;
		        /** Unique ID used to quickly index dependants of observables */
		        this._uid = String(++ObservableValue.UID);
		        /** Counter that is incremented every time the value becomes unstable
		          * (i.e. value set directly, dependency changed, etc.) */
		        this._dirtyIdx = 0;
		        // hold off on evaluating until value getter is called
		        if (getter) {
		            this._getter = getter;
		            this._dirtyIdx++;
		        }
		        this._setter = setter;
		        // create signal with up/down callbacks
		        this._Signal = Signal_1.defineSignal(ObservableValueSignal, function () {
		            // a first handler has been connected, force re-evaluate to
		            // start observing dependencies if there are any:
		            _this._watched = true;
		            if (!_this._depChecks || _this._depChecks.length) {
		                _this._removeDependencies();
		                _this._dirtyIdx++;
		                unobserved(function () { return _this.value; });
		            }
		            else {
		                // no dependencies last time, no need to check
		                _this._removeDependencies();
		            }
		        }, function () {
		            // all handlers have been disconnected:
		            _this._watched = false;
		            _this._removeDependencies();
		        });
		    }
		    /** Encapsulate given value as an ObservableValue */
		    ObservableValue.fromValue = function (value) {
		        var result = new ObservableValue();
		        result.value = value;
		        return result;
		    };
		    /** Encapsulate promised value as an ObservableValue */
		    ObservableValue.fromPromise = function (valuePromise) {
		        var result = new ObservableValue();
		        valuePromise.then(function (value) { result.value = value; });
		        return result;
		    };
		    /** Set a getter function for this observable value; should return a
		      * current value, or another ObservableValue instance, or set value
		      * directly; returns this */
		    ObservableValue.prototype.getter = function (f) {
		        this._getter = f;
		        this._dirtyIdx++;
		        // remove dependencies and current static value
		        this._removeDependencies();
		        if (f)
		            delete this._val;
		        return this;
		    };
		    /** Set a setter function for this observable value; should use given
		      * value internally, or set value directly; returns this */
		    ObservableValue.prototype.setter = function (f) {
		        this._setter = f;
		        return this;
		    };
		    Object.defineProperty(ObservableValue.prototype, "value", {
		        /** Observable value, (re-) evaluated only if necessary;
		          * when set to an ObservableValue instance, this property returns that
		          * instance's value, until this property is set to another value
		          * (except if the ObservableValue has a setter, which is called first);
		          * plain Array values are turned into ObservableArray instances,
		          * and plain Object instances into Observable instances */
		        get: function () {
		            if (this._getting)
		                return this._val;
		            // register as dependency to previously evaluating observable
		            if (currentWatchedEvaling)
		                currentWatchedEvaling._addConnection(this);
		            else if (currentUnwatchedEvaling)
		                currentUnwatchedEvaling._addCheck(this);
		            // re-evaluate if necessary:
		            if (this._needsEval()) {
		                var oldConnections = this._depConnections;
		                var hasValue = this.hasOwnProperty("_val");
		                var oldValue = this._val;
		                // set this instance as currently evaluating to find dependencies
		                var prevWatched = currentWatchedEvaling, prevUnwatched = currentUnwatchedEvaling;
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
		                    var result = this._getter.call(undefined);
		                    if (!(result === undefined && this._direct))
		                        this._val = result;
		                }
		                finally {
		                    this._getting = false;
		                    // stop solliciting dependencies
		                    currentWatchedEvaling = prevWatched;
		                    currentUnwatchedEvaling = prevUnwatched;
		                }
		                // mark value as up to date
		                this._valIdx = this._dirtyIdx;
		                // unsubscribe from old dependencies that are no longer used
		                if (this._depConnections) {
		                    for (var uid in oldConnections)
		                        if (!this._depConnections[uid])
		                            oldConnections[uid].disconnect();
		                }
		                // emit signal(s) if changed
		                if (hasValue && this._val !== oldValue) {
		                    this._auxSignalers && this._auxSignalers.forEach(function (f) { return f(); });
		                    new this._Signal(this._val).emitSync();
		                }
		            }
		            // return new value or proxy other ObservableValue's value
		            var value = this._val;
		            while (value instanceof ObservableValue)
		                value = value.value;
		            return value;
		        },
		        set: function (value) {
		            // convert plain arrays and objects (unless about to run setter)
		            if (!this._setter || this._setting) {
		                // make ObservableArray instances out of plain Arrays
		                if (value instanceof Array && value.constructor === Array) {
		                    value = ObservableArray_1.ObservableArray.fromArray(value);
		                }
		                // make ObservableObject instances out of plain Objects
		                if (value instanceof Object && value.constructor === Object) {
		                    value = new ObservableObject(value);
		                }
		            }
		            // check what to do with the new value:
		            if (this._getting) {
		                // set value directly, no signals but mark as changed
		                this._val = value;
		                this._direct = true;
		                this._valIdx = ++this._dirtyIdx;
		            }
		            else if (this._getter && !this._setter) {
		                // cannot set value directly outside of getter function
		                throw new Error("Cannot set value");
		            }
		            else if ((!this._setter || this._setting) &&
		                (this._val instanceof ObservableValue) &&
		                this._val._setter) {
		                // proxy through observable value setter
		                this._val.value = value;
		            }
		            else if (this._setter && !this._setting) {
		                // invoke setter
		                this._setting = true;
		                try {
		                    this._setter.call(undefined, value);
		                }
		                finally {
		                    this._setting = false;
		                }
		            }
		            else if (value !== this._val) {
		                // set value and emit signal(s)
		                this._val = value;
		                this._auxSignalers && this._auxSignalers.forEach(function (f) { return f(); });
		                new this._Signal(value).emitSync();
		                // mark value as changed (but not dirty)
		                this._valIdx = ++this._dirtyIdx;
		            }
		        },
		        enumerable: true,
		        configurable: true
		    });
		    /** Returns .value (observable if used within an observable getter) */
		    ObservableValue.prototype.valueOf = function () { return this.value; };
		    /** Returns .value as a string (observable if used within an observable getter) */
		    ObservableValue.prototype.toString = function () { return String(this.value); };
		    /** Returns last value set, does not re-evaluate and/or add dependency */
		    ObservableValue.prototype.getLastValue = function () {
		        // return value or proxy other ObservableValue's value
		        var value = this._val;
		        while (value instanceof ObservableValue)
		            value = value.getLastValue();
		        return value;
		    };
		    /** Add callback to invoke after value changed, either after it is set
		      * directly or after one ore more observable values used by the getter
		      * function changed and the getter function returns a different value;
		      * Note that given callback is not called immediately with current
		      * value, and only on change; omit callback to watch indefinitely */
		    ObservableValue.prototype.watch = function (callback) {
		        return this._Signal.connect(function (value) { return Async_1.defer(callback, [value]); });
		    };
		    /** Return an ObservableValue that depends on the result of the given
		      * function, which is called with the current observable value whenever
		      * that changes; however values used by the given function itself are
		      * not observed (wrap given function in observe(...) to observe those
		      * as well) */
		    ObservableValue.prototype.map = function (callback) {
		        var _this = this;
		        var lastValue = {}, mapped;
		        return mapped = new ObservableValue(function () {
		            var value = _this.value;
		            if (value === lastValue)
		                return mapped.value;
		            return unobserved(callback, lastValue = value);
		        });
		    };
		    Object.defineProperty(ObservableValue.prototype, "watched", {
		        /** True if this observable value is currently watched, either by handlers
		          * that were set directly, or by dependent observables */
		        get: function () { return this._watched; },
		        enumerable: true,
		        configurable: true
		    });
		    Object.defineProperty(ObservableValue.prototype, "writable", {
		        /** True if this observable value is writable (not only a getter defined) */
		        get: function () { return !this._getter || !!this._setter; },
		        enumerable: true,
		        configurable: true
		    });
		    /** Add a signal to emit when this value changes, but do not watch for
		      * changes directly (i.e. does not connect to signal and start watching);
		      * used e.g. to emit Observable.PropertyChange */
		    ObservableValue.prototype.emitOnChange = function (signal, data) {
		        if (!this._auxSignalers)
		            this._auxSignalers = [];
		        this._auxSignalers.push(function () { signal(data); });
		    };
		    /** Clear value and remove getter/setter functions, stop observing dependants */
		    ObservableValue.prototype.clear = function () {
		        this.getter(null).setter(null);
		    };
		    /** Returns true if value needs to be reevaluated */
		    ObservableValue.prototype._needsEval = function () {
		        if (!this._getter)
		            return false;
		        if ((this._valIdx || 0) !== this._dirtyIdx)
		            return true;
		        // if value is watched, then dependencies are watched too
		        // and are up to date if value is up to date (above check)
		        if (this._watched)
		            return false;
		        // check if dependencies (may) have changed since last evaluation
		        return !this._depChecks || this._depChecks.some(function (f) { return f({}); });
		    };
		    /** Mark as dirty (if not already dirty) and schedule re-evaluation of
		      * value if still watched */
		    ObservableValue.prototype._asyncEval = function () {
		        var _this = this;
		        if ((this._valIdx || 0) === this._dirtyIdx && !this._getting) {
		            this._dirtyIdx++;
		            Async_1.defer(function () {
		                if (_this._watched && _this._valIdx !== _this._dirtyIdx)
		                    _this.value;
		            });
		        }
		    };
		    /** Register a watched dependency on this value from another */
		    ObservableValue.prototype._addConnection = function (other) {
		        if (other === this)
		            return;
		        // mark as dirty whenever other value changes (not async since
		        // signal is always emitted synchronously, see above)
		        var link = other._Signal.connect(this._asyncEval.bind(this));
		        // store connection (to disconnect when no longer observed)
		        (this._depConnections ||
		            (this._depConnections = {}))[other._uid] = link;
		        link._observable_dep = other; // DEBUG USE
		    };
		    /** Register an unwatched dependency on this value (checked for changes
		      * every time when getting the unwatched observable value) */
		    ObservableValue.prototype._addCheck = function (other) {
		        var _this = this;
		        if (other === this)
		            return;
		        // maintain a function to check if the other value has changed
		        // (different _dirtyIdx or recurse down dependency tree)
		        var lastDirtyIdx = other._dirtyIdx;
		        (this._depChecks || (this._depChecks = [])).push(function (seen) {
		            if (seen[_this._uid])
		                return true;
		            seen[_this._uid] = true;
		            return (other._dirtyIdx !== lastDirtyIdx ||
		                !other._depChecks || other._depChecks.some(function (f) { return f(seen); }));
		        });
		    };
		    /** Disconnect existing dependencies */
		    ObservableValue.prototype._removeDependencies = function () {
		        delete this._depChecks;
		        var connections = this._depConnections;
		        delete this._depConnections;
		        for (var uid in connections)
		            connections[uid].disconnect();
		    };
		    ObservableValue.UID = 0;
		    return ObservableValue;
		}());
		exports.ObservableValue = ObservableValue;
		// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
		var ObservableMemberSignal = (function (_super) {
		    __extends(ObservableMemberSignal, _super);
		    function ObservableMemberSignal() {
		        _super.apply(this, arguments);
		    }
		    return ObservableMemberSignal;
		}(Signal_1.Signal));
		exports.ObservableMemberSignal = ObservableMemberSignal;
		/** Represents an object with observable members
		  * (use the constructor's argument to specify which members are observable
		  * and their initial values/getters/setters); should normally be extended
		  * into a derived class, but can be used as new Observable({...}) as well,
		  * OR use static .mixin(object) to mix into any object */
		var ObservableObject = (function () {
		    function ObservableObject(obj) {
		        if (obj instanceof Object)
		            ObservableObject.makeObservable(this, obj);
		        _addPropertyChangeSignal(this);
		    }
		    /** Returns a new ObservableObject with properties from given object;
		      * (same as new ObservableObject(...) but with typed return value) */
		    ObservableObject.fromObject = function (obj) {
		        return new ObservableObject(obj);
		    };
		    /** Mix in ObservableObject method and signal, and make all enumerable
		      * properties of given object observable */
		    ObservableObject.mixin = function (obj) {
		        return ObservableObject.makeObservable(obj, obj);
		    };
		    /** Returns true if property with given name is observable */
		    ObservableObject.prototype.hasObservableProperty = function (name) {
		        return ObservableObject.isObservableProperty(this, name);
		    };
		    return ObservableObject;
		}());
		exports.ObservableObject = ObservableObject;
		/** Helper function to add the PropertyChange signal to any object */
		function _addPropertyChangeSignal(obj) {
		    if (!obj.PropertyChange) {
		        Object.defineProperty(obj, "PropertyChange", {
		            configurable: false,
		            writable: false,
		            enumerable: false,
		            value: Signal_1.defineSignal(ObservableMemberSignal)
		        });
		    }
		}
		function observe(v) {
		    return (v instanceof Function) ? new ObservableValue(v) :
		        (v instanceof Promise_1.Promise) ? ObservableValue.fromPromise(v) :
		            ObservableObject.fromObject(v);
		}
		exports.observe = observe;
		function unobserved(f) {
		    var prevWatched = currentWatchedEvaling;
		    var prevUnwatched = currentUnwatchedEvaling;
		    try {
		        currentWatchedEvaling = null;
		        currentUnwatchedEvaling = null;
		        return f.apply(undefined, Array.prototype.slice.call(arguments, 1));
		    }
		    finally {
		        currentWatchedEvaling = prevWatched;
		        currentUnwatchedEvaling = prevUnwatched;
		    }
		}
		exports.unobserved = unobserved;
		/** Property/accessor decorator, makes properties observable (using getter and
		  * setter on prototype property) */
		function observable(target, key, descriptor) {
		    if (!descriptor)
		        descriptor = { enumerable: true };
		    var getter = descriptor.get, setter = descriptor.set;
		    var initial = getter || target[key];
		    descriptor.get = function () {
		        // make property actually observable and get its value
		        _defineObservableProperty(this, key, getter ? undefined : initial, getter && getter.bind(this), setter && setter.bind(this));
		        return this[key];
		    };
		    descriptor.get["*observable-getter"] = true;
		    descriptor.set = function (value) {
		        if (getter || setter) {
		            // define observable property with getter and/or setter
		            _defineObservableProperty(this, key, undefined, getter && getter.bind(this), setter && setter.bind(this));
		            this[key] = value;
		        }
		        else {
		            // define observable property with initial value
		            _defineObservableProperty(this, key, value);
		        }
		    };
		    return descriptor;
		}
		exports.observable = observable;
		// group helper functions in ObservableObject class 
		var ObservableObject;
		(function (ObservableObject) {
		    function makeObservable(obj, spec) {
		        if (typeof spec === "string" || typeof spec === "number") {
		            // add getter and setter for single property value
		            var propertyName = String(spec);
		            _defineObservableProperty(obj, propertyName, obj[propertyName]);
		        }
		        else {
		            // define several non-configurable properties with getters and setters
		            var specIsObservable = (spec instanceof ObservableObject);
		            for (var member in spec) {
		                if (specIsObservable ? spec.hasObservableProperty(member) :
		                    Object.prototype.hasOwnProperty.call(spec, member))
		                    _defineObservableProperty(obj, member, spec[member]);
		            }
		            // add mixins
		            Object.defineProperty(obj, "hasObservableProperty", {
		                configurable: false,
		                writable: false,
		                enumerable: false,
		                value: ObservableObject.prototype.hasObservableProperty
		            });
		            _addPropertyChangeSignal(obj);
		        }
		        return obj;
		    }
		    ObservableObject.makeObservable = makeObservable;
		    /** Delete the property with given name and clear its observable value */
		    function deleteObservableProperty(obj, member) {
		        var hiddenMember = _getHiddenName(member);
		        var observable = obj[hiddenMember];
		        if (observable && observable.watched && observable.writable)
		            observable.value = undefined;
		        delete obj[member];
		        delete obj[hiddenMember];
		    }
		    ObservableObject.deleteObservableProperty = deleteObservableProperty;
		    /** Returns true if property with given name is observable */
		    function isObservableProperty(obj, member) {
		        var hiddenMember = _getHiddenName(member);
		        if (Object.prototype.hasOwnProperty.call(obj, hiddenMember))
		            return true;
		        var ppDescriptor = _getPPDescriptor(obj, member);
		        if (ppDescriptor && ppDescriptor.get && ppDescriptor.get["*observable-getter"])
		            return true;
		        return false;
		    }
		    ObservableObject.isObservableProperty = isObservableProperty;
		})(ObservableObject = exports.ObservableObject || (exports.ObservableObject = {}));
		/** Helper function to get a prototype's property descriptor */
		function _getPPDescriptor(obj, member) {
		    var proto = Object.getPrototypeOf(obj);
		    return proto ?
		        Object.getOwnPropertyDescriptor(proto, String(member)) ||
		            _getPPDescriptor(proto, member) :
		        null;
		}
		/** Add a getter and setter for a single property value */
		function _defineObservableProperty(obj, member, initial, getter, setter) {
		    var hiddenMember = _getHiddenName(member);
		    // clear existing observable value, if any
		    if (Object.prototype.hasOwnProperty.call(obj, hiddenMember))
		        ObservableObject.deleteObservableProperty(obj, member);
		    else {
		        Object.defineProperty(obj, hiddenMember, {
		            configurable: true,
		            enumerable: false,
		            value: false
		        });
		    }
		    // helper function that returns ObservableValue for "this".member
		    function getObservableValue() {
		        if (obj[hiddenMember])
		            return obj[hiddenMember];
		        var instance;
		        if (initial instanceof ObservableValue) {
		            // use reference directly
		            instance = initial;
		        }
		        else {
		            // create new observable value
		            instance = new ObservableValue();
		            instance.value = initial;
		            if (getter)
		                instance.getter(getter);
		            if (setter)
		                instance.setter(setter);
		        }
		        Object.defineProperty(obj, hiddenMember, {
		            value: instance,
		            writable: false,
		            enumerable: false,
		            configurable: true
		        });
		        // emit PropertyChange for Observable object properties
		        if (obj.PropertyChange instanceof Function) {
		            instance.emitOnChange(obj.PropertyChange, member);
		            instance._Observable_member = member;
		            instance._Observable_instance = obj;
		        }
		        else if (obj instanceof ObservableArray_1.ObservableArray) {
		            instance._Observable_index = member;
		            instance._Observable_array = obj;
		        }
		        return instance;
		    }
		    // apply getter and setter
		    Object.defineProperty(obj, member, {
		        get: function () {
		            return getObservableValue().value;
		        },
		        set: function (value) {
		            getObservableValue().value = value;
		        },
		        enumerable: true,
		        configurable: true
		    });
		}
		function _getHiddenName(name) {
		    return "*observable:" + name;
		}


	/***/ },
	/* 5 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		var Observable_1 = __webpack_require__(4);
		/** Encapsulates Array with observable properties;
		  * NOTE: this works exactly like a regular array, but setting elements outside
		  * the bounds of the array (>length) does NOT work: set length first */
		var ObservableArray = (function () {
		    function ObservableArray() {
		        var _this = this;
		        var _length = Observable_1.ObservableValue.fromValue(0);
		        Object.defineProperty(this, "length", {
		            get: function () { return _length.value; },
		            set: function (value) {
		                // make new numeric properties observable
		                var currentLength = _length.getLastValue() || 0;
		                while (currentLength < value)
		                    Observable_1.ObservableObject.makeObservable(_this, currentLength++);
		                // clear removed properties
		                for (var l = value; l < currentLength; l++)
		                    Observable_1.ObservableObject.deleteObservableProperty(_this, l);
		                _length.value = value;
		            },
		            configurable: true
		        });
		    }
		    /** Static: create an ObservableArray out of a regular Array */
		    ObservableArray.fromArray = function (array) {
		        var result = new ObservableArray();
		        for (var i = array.length - 1; i >= 0; i--)
		            result[i] = array[i];
		        result.length = array.length;
		        return result;
		    };
		    /** Return a read-only ObservableArray with each value of the original
		      * array mapped to the result of the given function; observable values
		      * used in the map function are not observed (like ObservableValue map
		      * method); the resulting array length changes along with the original
		      * array length. */
		    ObservableArray.prototype.mapAsync = function (callbackfn, thisArg) { return; };
		    ;
		    return ObservableArray;
		}());
		exports.ObservableArray = ObservableArray;
		ObservableArray.prototype = new Array;
		ObservableArray.prototype.constructor = ObservableArray;
		// these functions should not depend on .length but would if not wrapped
		var _arrayPush = ObservableArray.prototype.push;
		ObservableArray.prototype.push = function () {
		    var _this = this;
		    var items = [];
		    for (var _i = 0; _i < arguments.length; _i++) {
		        items[_i - 0] = arguments[_i];
		    }
		    return Observable_1.unobserved(function () { return _arrayPush.apply(_this, items); });
		};
		var _arrayUnshift = ObservableArray.prototype.unshift;
		ObservableArray.prototype.unshift = function () {
		    var _this = this;
		    var items = [];
		    for (var _i = 0; _i < arguments.length; _i++) {
		        items[_i - 0] = arguments[_i];
		    }
		    return Observable_1.unobserved(function () { return _arrayUnshift.apply(_this, items); });
		};
		// implement mapAsync
		ObservableArray.prototype.mapAsync = function (callbackfn, thisArg) {
		    var _this = this;
		    var result = new ObservableArray();
		    // proxy length and all numeric properties in result
		    var _length = 0;
		    var makeMap = function (i) {
		        var lastValue = {}, mapped;
		        return mapped = new Observable_1.ObservableValue(function () {
		            var value = _this[i];
		            // run callback only when value changes (not e.g. when starting
		            // to watch result and finding dependencies: there are none)
		            if (value === lastValue)
		                return mapped.value;
		            return Observable_1.unobserved(function (value) {
		                return (i >= 0 && i < _this.length) ?
		                    callbackfn.call(thisArg || result, value, i, _this) :
		                    undefined;
		            }, lastValue = value);
		        });
		    };
		    Object.defineProperty(result, "length", {
		        get: function () {
		            var newLength = _this.length;
		            if (newLength > _length) {
		                // make new numeric properties observable
		                var spec = {};
		                for (var l = _length; l < newLength; l++)
		                    spec[l] = makeMap(l);
		                Observable_1.ObservableObject.makeObservable(result, spec);
		            }
		            else {
		                // clear removed properties
		                for (var l = newLength; l < _length; l++)
		                    Observable_1.ObservableObject.deleteObservableProperty(result, l);
		            }
		            return _length = newLength;
		        },
		        set: function (value) {
		            throw new Error("Cannot modify mapAsync result");
		        }
		    });
		    // initialize all members
		    Observable_1.unobserved(function () { return result.length; });
		    return result;
		};
		// override concat, which otherwise would see ObservableArrays as values:
		ObservableArray.prototype.concat = function () {
		    var items = [];
		    for (var _i = 0; _i < arguments.length; _i++) {
		        items[_i - 0] = arguments[_i];
		    }
		    return Array.prototype.concat.apply(this.slice(0), items.map(function (item) { return (item instanceof ObservableArray) ? item.slice(0) : item; }));
		};


	/***/ },
	/* 6 */
	/***/ function(module, exports, __webpack_require__) {

		"use strict";
		var Promise_1 = __webpack_require__(3);
		/** Helper function for sending a simple JSON request, returns a promise for
		  * the XHR responseText */
		function _xhr(method, url, data, headers) {
		    return new Promise_1.Promise(function (resolve, reject) {
		        try {
		            // create request and send data
		            var xhr = new XMLHttpRequest();
		            xhr.open(method, url, true);
		            if (headers) {
		                for (var key in headers) {
		                    if (Object.prototype.hasOwnProperty.call(headers, key))
		                        xhr.setRequestHeader(key, headers[key]);
		                }
		            }
		            if (data !== undefined) {
		                xhr.setRequestHeader("Content-Type", "application/json");
		                xhr.send(JSON.stringify(data));
		            }
		            else
		                xhr.send();
		            // await response and resolve or reject promise
		            xhr.onreadystatechange = function () {
		                try {
		                    if (xhr.readyState == 4) {
		                        if (xhr.status >= 200 && xhr.status < 400)
		                            resolve(xhr.responseText);
		                        else
		                            reject(new Error("HTTP " + xhr.status +
		                                (xhr.responseText ? ": " + xhr.responseText : "")));
		                    }
		                }
		                catch (all) {
		                    reject(all);
		                }
		            };
		        }
		        catch (all) {
		            reject(all);
		        }
		    });
		}
		/** Helper function to add an "Accept: application/json" header */
		function _withAccept(headers, accept) {
		    if (headers === void 0) { headers = {}; }
		    if (accept === void 0) { accept = "application/json"; }
		    if (!headers["Accept"])
		        headers["Accept"] = accept;
		    return headers;
		}
		/** A static class that wraps simple request methods to send and receive
		  * data asynchronously */
		var Http = (function () {
		    function Http() {
		    }
		    /** Perform a GET request with given parameters and headers, if any;
		      * returns a promise that resolves to the response text */
		    Http.getText = function (url, params, headers) {
		        if (params) {
		            var first = (url.indexOf("?") < 0);
		            for (var key in params) {
		                if (Object.prototype.hasOwnProperty.call(params, key)) {
		                    url += (first ? "?" : "&") + encodeURIComponent(key)
		                        + "=" + encodeURIComponent(params[key]);
		                    first = false;
		                }
		            }
		        }
		        return _xhr("GET", url, undefined, headers);
		    };
		    /** Perform a GET request with given parameters and headers, if any;
		      * returns a promise that resolves to the parsed JSON response */
		    Http.get = function (url, params, headers) {
		        return Http.getText(url, params, _withAccept(headers))
		            .then(function (responseText) { return JSON.parse(responseText); });
		    };
		    /** Perform a POST request with given object (sent as JSON) and headers,
		      * if any; returns a promise that resolves to the parsed JSON response */
		    Http.post = function (url, data, headers) {
		        return _xhr("POST", url, data, _withAccept(headers))
		            .then(function (responseText) { return JSON.parse(responseText); });
		    };
		    /** Perform a PUT request with given object (sent as JSON) and headers,
		      * if any; returns a promise that resolves to the parsed JSON response */
		    Http.put = function (url, data, headers) {
		        return _xhr("PUT", url, data, _withAccept(headers))
		            .then(function (responseText) { return JSON.parse(responseText); });
		    };
		    /** Perform a DELETE request with given object (sent as JSON) and headers,
		      * if any; returns a promise that resolves to the parsed JSON response */
		    Http.delete = function (url, data, headers) {
		        return _xhr("DELETE", url, data, _withAccept(headers))
		            .then(function (responseText) { return JSON.parse(responseText); });
		    };
		    /** Perform a GET request with given parameters and headers, if any;
		      * returns a promise that resolves to the parsed HTML result body as a
		      * document fragment (ignores everything before and after body tag,
		      * if any; inserts everything if no body tag is found, i.e. partial HTML) */
		    Http.getHtmlContent = function (url, params, headers) {
		        return Http.getText(url, params, _withAccept(headers, "text/html"))
		            .then(function (responseText) {
		            // find body tag and keep only its content
		            responseText = String(responseText || "");
		            var startTag = responseText.match(/<body(?:>|\s[^>]+>)/m);
		            if (startTag) {
		                responseText = responseText.slice(startTag.index + startTag[0].length);
		                var endTagPos = responseText.lastIndexOf("</body>");
		                if (endTagPos >= 0)
		                    responseText = responseText.slice(0, endTagPos);
		            }
		            // set inner HTML of a placeholder element
		            var placeholder = document.createElement("div");
		            placeholder.innerHTML = responseText;
		            // transfer resulting elements to document fragment
		            var result = document.createDocumentFragment();
		            while (placeholder.firstChild)
		                result.appendChild(placeholder.firstChild);
		            return result;
		        });
		    };
		    return Http;
		}());
		exports.Http = Http;


	/***/ }
	/******/ ]);

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";


/***/ }
/******/ ]);