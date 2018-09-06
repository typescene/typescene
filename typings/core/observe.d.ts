import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
/**
 * Class decorator: make the decorated class an observer of given target class. The target class must be a sub class of `ManagedObject`. This amends properties of the target class with dynamic setters to invoke the observer's handler methods when any change or event occurs, on _all_ instances of the given target class, as well as derived classes.
 *
 * A new observer (instance of the observer class) is created for each instance of the target class, the first time an observed change occurs. The constructor is invoked with a single argument, being a reference to the observed object (an instance of the target class).
 *
 * This function finds all methods on the observer class (but NOT on any base classes, i.e. extending an observer class does not consider any methods on the original observer class) and turns appropriate methods into handlers for changes and/or events:
 * - Any method decorated with the `@onPropertyChange` decorator. Methods are invoked with arguments for the current property value, an optional event reference (i.e. change event), and the observed property name.
 * - Any method decorated with the `@onPropertyEvent` decorator. Methods are invoked with arguments for the current property value, and an event reference (any type of event that occurred on the property/ies with names specified in the call to the decorator).
 * - Any method that takes the form `on[PropertyName]Change` where _propertyName_ is the name of the observed property (must have a lowercase first character); or `on_[propertyName]Change` where _propertyName_ is the exact name of the observed property. Methods are invoked with arguments for the current property value, and an optional event reference (i.e. change event).
 * - Any method that takes the form `on[EventName]`, which is invoked with a single `ManagedEvent` argument. The event name (`ManagedEvent.name` property) must match exactly, with the exception of the `onChange` method which is invoked for all events that derive from `ManagedChangeEvent`, and `onEvent` which is invoked for _all_ events.
 * - Any method as above with an `...Async` suffix, which is invoked asynchronously and should return a `Promise`. Asynchronous property change handlers are not invoked twice with the same value. If the value has been changed and then changed back before invoking the handler, no handler is called at all. Handlers can be rate limited using the `@rateLimit` decorator.
 * @note Since instances of classes that derive from the target class are _also_ observed, make sure that the observer does not depend on any functionality that may be overridden or fundamentally changed by any derived class.
 * @note This function is available as `observe` and `ManagedObject.observe` on observable classes. See also `ManagedObject.handle` for a simpler way to handle events emitted directly by instances of a managed object class.
 * @exception Throws an error if the target class does not derive from `ManagedObject`.
 * @decorator
 */
export declare function observe<T extends ManagedObject>(Target: ManagedObjectConstructor<T>): (Observer: new (instance: T) => any) => void;
/**
 * Observed property decorator: use given property as the shadow (writable) property for decorated property.
 * The decorated property itself (which _must_ have a property getter) will not be observed, and given property is observed instead. However, the 'current value' passed to observer methods will still be the value that is obtained through the getter of the decorated property.
 * @param shadowPropertyName
 *  the name of the shadow property that should be observed instead
 * @param forceAsync
 *  if true, forces observers to observe this property asynchronously _only_, to prevent the occurance of side effects when setting the value of the shadow property; any attempt to observe the decorated property using a synchronous observer method (without `...Async`) results in an error
 * @exception Throws an error if the decorated property does not have its own getter.
 * @decorator
 */
export declare function shadowObservable(shadowPropertyName: string, forceAsync?: boolean): PropertyDecorator;
/**
 * Observer method decorator: amend decorated method to turn it into a handler for changes to given property/ies.
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe` and `@observe`.
 * @decorator
 */
export declare function onPropertyChange(...observedProperties: string[]): MethodDecorator;
/**
 * Observer method decorator: amend decorated method to turn it into a handler for events on managed objects that are referred to by given managed reference property/ies (decorated with `@managed`, `@managedChild`, `@managedDependency`, or `@compose`).
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe` and `@observe`.
 * @decorator
 */
export declare function onPropertyEvent(...observedProperties: string[]): MethodDecorator;
/**
 * Observer method decorator: limit the decorated asynchronous observer method to be invoked only at a maximum frequency, determined by the given number of milliseconds.
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe` and `@observe`.
 * @decorator
 */
export declare function rateLimit(n: number): MethodDecorator;
