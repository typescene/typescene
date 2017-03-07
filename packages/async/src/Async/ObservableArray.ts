import { defer } from "./Defer";
import { ObservableValue, assertUnobserved, unobserved } from "./Observable";
import { makePropertyObservable, deleteObservableProperty } from "./ObservableObject";
declare class Map { get; set; forEach; delete; };

/** Encapsulates `Array` with observable properties; the result works exactly like a regular array, but setting elements outside the bounds of the array (>= length) does NOT work: length must be set first */
export class ObservableArray<T> {
    /** Create an `ObservableArray` out of a regular Array */
    static fromArray<T>(array: Array<T>): ObservableArray<T> {
        var result = new ObservableArray<T>();
        for (var i = array.length - 1; i >= 0; i--)
            result[i] = array[i];
        result.length = array.length;
        return result;
    }

    /** Create an `ObservableArray` that takes array elements from the array in given `ObservableValue`, or the value itself as a single element if it is not an array, or an empty array if the value is null or undefined; changes in array elements and/or observable value are reflected asynchronously */
    static fromObservableValue<T>(observableValue: ObservableValue<T[] | T | undefined>):
        ObservableArray<T> {
        var result = new ObservableArray<any>();

        // proxy length and all numeric properties in result
        var _length = 0;
        var makeMap = (i: number) => new ObservableValue(() => {
            var value = observableValue.value;
            if (value instanceof Array)
                return value[i];
            else if (i === 0 && value !== null)
                return value;
            else
                return undefined;
        });
        Object.defineProperty(result, "length", {
            get: () => {
                var value = observableValue.value;
                var newLength = (value instanceof Array) ? value.length :
                    (value === undefined || value === null) ? 0 : 1;
                if (newLength > _length) {
                    unobserved(() => {
                        // make new numeric properties observable
                        for (var l = _length; l < newLength; l++)
                            makePropertyObservable(result, l, makeMap(l));
                    });
                }
                else {
                    unobserved(() => {
                        // clear removed properties
                        for (var l = newLength; l < _length; l++)
                            deleteObservableProperty(result, l);
                    });
                }
                return _length = newLength;
            },
            set: function () {
                throw new Error("Cannot modify length of mapped array");
            }
        });

        // initialize all values
        unobserved(() => result.length);

        return result;
    }

    /** Create a new empty `ObservableArray` instance */
    constructor() {
        assertUnobserved();
        var _length = ObservableValue.fromValue(0);
        Object.defineProperty(this, "length", {
            get: () => _length.value,
            set: (value: number) => {
                // make new numeric properties observable
                var currentLength = _length.getLastValue() || 0;
                while (currentLength < value)
                    makePropertyObservable(this, currentLength++);

                // clear removed properties
                for (var l = value; l < currentLength; l++)
                    deleteObservableProperty(this, l);

                _length.value = value;
            },
            configurable: true
        });
    }

    /** Create a read-only `ObservableArray` with each value of the original array mapped to the result of the given getter function; observable values used in the map function are not observed (like `ObservableValue#map`); the getter is called for combinations of value and index (i.e. deleting a value in the middle of the source array will trigger changes for all elements after it; if the index is not important then use `.mapAsyncValues` instead); the resulting array length changes along with the original array length */
    public mapAsync<U>(callback: (value: T, index: number, array: T[]) =>
        (ObservableValue<U> | U), thisArg?: any): ObservableArray<U> {
        var result = new ObservableArray<U>();

        // keep length in an observable just like the properties to avoid
        // unexpected differences in change propagation timings
        var observableLength = new ObservableValue<number>(() => this.length);

        // proxy all numeric properties in result
        var _length = 0;
        var makeMap = (i: number) => {
            var lastValue = {};
            var mapped = new ObservableValue(() => {
                var value = this[i];
                if (value === lastValue) return mapped.value;
                return unobserved(value =>
                    (i >= 0 && i < this.length) ?
                        callback.call(thisArg || result, value, i, this) :
                        undefined,
                    lastValue = value)
            });
            return mapped;
        };
        Object.defineProperty(result, "length", {
            get: () => {
                var newLength = observableLength.value!;
                if (newLength > _length) {
                    unobserved(() => {
                        // make new numeric properties observable
                        for (var l = _length; l < newLength; l++)
                            makePropertyObservable(result, l, makeMap(l));
                    });
                }
                else if (newLength < _length) {
                    unobserved(() => {
                        // clear removed properties
                        for (var l = newLength; l < _length; l++)
                            deleteObservableProperty(result, l);
                    });
                }
                return _length = newLength;
            },
            set: function () {
                throw new Error("Cannot modify length of mapped array");
            }
        });

        // initialize all values
        unobserved(() => result.length);

        return result;
    }

    /** Create a read-only ObservableArray with each value of the original array mapped to the result of the given function; observable values used in the map function are not observed (like ObservableValue map method); the resulting array length changes along with the original array length; this method is slightly more expensive than mapAsync for larger arrays, especially in non-ES6 environments, but is overall more efficient because it avoids unnecessary callbacks when subscribed to */
    public mapAsyncValues<U>(callbackfn: (value: T) => (ObservableValue<U> | U)): ObservableArray<U> {
        // keep track of previously seen values in a Map (with "semi-polyfill")
        var _get: (v: any) => any, _add: (v: any, o: any) => void;
        var _del: (v: any) => void;
        var _forEach: (f: (o: any, v: any) => any) => void;
        if (typeof Map === "function") {
            // use native Map implementation
            var map = new Map();
            _get = map.get.bind(map), _add = map.set.bind(map);
            _forEach = map.forEach.bind(map);
            _del = map.delete.bind(map);
        }
        else {
            // use minimal approximation of Map methods
            var ownMap: { v: any, o: any }[] = [];
            _add = (v: any, o: any) => { ownMap.push({ v, o }) };
            _get = (v: any) => {
                var result;
                ownMap.some(x => (x.v === v ? (result = x.o, true) : false));
                return result;
            };
            _del = (v: any) => {
                ownMap.some((x, i) => (x.v === v ? !!ownMap.splice(i, 1) : false));
            };
            _forEach = (f: (o: any, v: any) => any) => {
                ownMap.slice(0).forEach(x => f(x.o, x.v));
            };
        }

        // keep track of all current inputs to be able to prune the map
        // (really only works when entire array is subscribed to)
        var currentInputs: any[] = [];
        var timer = -1;
        let deferPrune = () => {
            if (timer >= 0) clearTimeout(timer);
            let myTimer = timer = setTimeout(() => {
                if (myTimer === timer) {
                    timer = -1;
                    var len = this.length;
                    if (currentInputs.length > len)
                        currentInputs.length = len;
                    _forEach((o, v) => {
                        currentInputs.indexOf(v) < 0 && _del(v)
                    });
                }
            }, 1);
        };

        // prune the map when the array gets shorter
        new ObservableValue(() => this.length).subscribe(len => {
            if (currentInputs.length > len)
                deferPrune()
        });

        // map input array to another observable array
        var ownNaN = {}, ownUndefined = {};
        return this.mapAsync((v, i) => {
            var defv = v === undefined ? ownUndefined :
                (typeof v === "number" && isNaN(v)) ? ownNaN : v;
            if (currentInputs[i] !== undefined && currentInputs[i] !== defv)
                deferPrune();
            currentInputs[i] = defv;

            // return last result for same input value if found
            var found = _get(defv);
            if (found !== undefined) return found;

            // get result for current input value and keep it for later
            var o = callbackfn(v);
            _add(defv, o);
            return o;
        });
    }

    /** Create a read-only observable array that contains all values from the original array and all nested (observable) arrays, optionally removing gaps (i.e. undefined or null elements); the resulting array and its length _always_ change asynchronously with the contents of the original array, even if not subscribed to a value or the length property */
    public flattenAsync(removeGaps?: boolean) {
        // create an observable that all other properties depend on; this is
        // where the flattening actually happens, asynchronously
        var nonObservableFlat: T[] = [];
        var count = 0, lastCount: number | undefined;
        var o = new ObservableValue(() => {
            var i = 0;
            let f = (a: T[]) => {
                for (var v of a) {
                    if (v instanceof Array) {
                        // recurse on arrays, to add elements in this position
                        f(v);
                    }
                    else if (!removeGaps || v !== undefined && v !== null) {
                        // add element to result
                        nonObservableFlat[i++] = v;
                    }
                }
            }
            f(this);
            nonObservableFlat.length = i;

            // always return something new to force updates
            return (lastCount = ++count);
        });

        // use the observable value to update flattened array
        // (temporarily subscribe to avoid flattening again within
        // current defer timeframe)
        function flattenAutoSubscribe() {
            if (!o.subscribed && !ObservableValue.isObserving()) {
                unobserved(() => {
                    var temp = o.map(v => v).subscribe();
                    defer(() => { temp.clear() });
                });
            }
            o.value;
        }

        // proxy all flattened properties in result
        var makeItem = (i: number) => {
            var io = new ObservableValue(() => {
                // flatten the array first, if needed
                flattenAutoSubscribe();
                return nonObservableFlat[i];
            });
            return io;
        };

        // now, map all properties from this observable
        var result = new ObservableArray<T>();
        var _length = 0;
        Object.defineProperty(result, "length", {
            get: () => {
                // flatten the array first, if needed
                flattenAutoSubscribe();
                var newLength = nonObservableFlat.length;
                if (newLength > _length) {
                    unobserved(() => {
                        // make new numeric properties observable
                        for (var l = _length; l < newLength; l++)
                            makePropertyObservable(result, l, makeItem(l));
                    });
                }
                else if (newLength < _length) {
                    unobserved(() => {
                        // clear removed properties
                        for (var l = newLength; l < _length; l++)
                            deleteObservableProperty(result, l);
                    });
                }
                return _length = newLength;
            },
            set: function () {
                throw new Error("Cannot modify length of flattened array");
            }
        });

        // initialize all values
        unobserved(() => result.length);

        return result;
    }

    /** Represent observable arrays as regular JSON arrays */
    public toJSON() {
        return this.slice(0);
    }
}
var _mapAsync = ObservableArray.prototype.mapAsync;
var _mapAsyncValues = ObservableArray.prototype.mapAsyncValues;
var _flattenAsync = ObservableArray.prototype.flattenAsync;
var _toJSON = ObservableArray.prototype.toJSON;

/** Type definition to declare Array methods mixin */
export interface ObservableArray<T> extends Array<T> { }
ObservableArray.prototype = <any>new Array;
ObservableArray.prototype.constructor = ObservableArray;
ObservableArray.prototype.mapAsync = _mapAsync;
ObservableArray.prototype.mapAsyncValues = _mapAsyncValues;
ObservableArray.prototype.flattenAsync = _flattenAsync;
ObservableArray.prototype.toJSON = _toJSON;

// these functions should not depend on .length but would if not wrapped
var _arrayPush = ObservableArray.prototype.push;
ObservableArray.prototype.push = function (this: Array<any>, ...items: any[]) {
    return unobserved(() => _arrayPush.apply(this, items));
}
var _arrayUnshift = ObservableArray.prototype.unshift;
ObservableArray.prototype.unshift = function (this: Array<any>, ...items: any[]) {
    return unobserved(() => _arrayUnshift.apply(this, items));
}

// override concat, which otherwise would see ObservableArrays as values:
ObservableArray.prototype.concat = function <T>(this: Array<any>, ...items: (T | T[])[]): T[] {
    return Array.prototype.concat.apply(this.slice(0), items.map(
        item => (item instanceof ObservableArray) ? item.slice(0) : item));
}

/** Returns an ObservableArray instance based on the result of given function: if the returned value is an array, then all elements are copied to the result; if the returned value is an observable array, all elements are proxied; if the returned value is not an array, the result contains this value as a single element; if the returned value is null or undefined, the result will be an empty array; changes in values/elements are reflected asynchronously */
export function observeArray<T>(f: () => (T[] | T | undefined)): ObservableArray<T> {
    return ObservableArray.fromObservableValue(new ObservableValue(f));
}