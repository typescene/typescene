import { ObservableValue, unobserved } from "./Observable";
import { makePropertyObservable } from "./ObservableObject";

/** _Property decorator_, makes a property observable on every instance, with a read-only value shared across all instances taken from an (earlier OR later) call to `inject`, *until* the property is directly assigned to [requires ES5+ target] [decorator] */
export function injectable(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    if (!descriptor) descriptor = { enumerable: true };

    // capture existing value (e.g. method on prototype)
    var value = descriptor.value;
    delete descriptor.value;
    delete descriptor.writable;

    // use a single observable per class to capture the last injected value
    var injector = ObservableValue.fromValue(value);
    descriptor.get = function (this: any) {
        unobserved(() => {
            makePropertyObservable(this, key,
                ObservableValue.fromValue(injector));
        });
        return this[key];
    };

    // setter just initializes an observable with given value
    // (will ignore injection altogether)
    descriptor.set = function (this: any, value: any) {
        makePropertyObservable(this, key);
        this[key] = value;
    };

    // store a reference to the observable injector value
    (<any>descriptor.get)["*injector"] = injector;

    return descriptor;
}

/** Set given injectable observable properties (decorated with `injectable`) on *all* instances of given class and derived classes to the given values, except for instances where the property has been overwritten directly; may be called multiple times even with the same properties to redefine their injected value; returns an object that contains the previous injected values (for e.g. overriding an injected function that calls into the previously injected function; when injecting into a derived class, these properties use accessors to return latest overridden injected values on base class(es) dynamically) */
export function inject<SpecT extends { [name: string]: any }>(
    targetClass: Function, spec: SpecT): SpecT {
    var result: any = {};
    for (var name in spec) {
        if (!Object.prototype.hasOwnProperty.call(spec, name)) continue;

        // get the injector observable for the property on given prototype,
        // add a value or getter on the result object that reflects the old OR
        // overridden (observable) value
        let getInjector: Function = (proto: any, d?: PropertyDescriptor) => {
            if (!proto) return undefined;
            var desc = Object.getOwnPropertyDescriptor(proto, name);
            if (!desc || !desc.get || !(<any>desc.get)["*injector"]) {
                // recurse if not defined at this level
                let getter = () => getInjector(Object.getPrototypeOf(proto));
                let injector = getter();
                if (d && injector) {
                    // found the injector further down the prototype chain
                    d.get = () => getter().getLastValue();
                }
                return injector;
            }
            else {
                // found the injector observable
                let injector: ObservableValue<any> = (<any>desc.get)["*injector"];
                if (d) {
                    // store the last value
                    d.value = injector.getLastValue();
                }
                return injector;
            }
        }
        var d: PropertyDescriptor = { enumerable: true, configurable: false };
        var injector = getInjector(targetClass.prototype, d);
        if (!injector)
            throw new TypeError("Not an injected property: " + name);

        // store getter or value on result object
        Object.defineProperty(result, name, d);

        // if injecting on derived class, use overriding injector instead
        if (d.get) {
            var override = injectable(targetClass.prototype, name);
            Object.defineProperty(targetClass.prototype, name, override);
            injector = override.get["*injector"];
        }

        // set the new value in the (new) injector observable
        injector.value = spec[name];
    }
    return result;
}
