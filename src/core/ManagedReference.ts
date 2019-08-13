import { ManagedChangeEvent, ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import * as util from "./util";

/** Property ID for the single reference link used by ManagedReference */
const REF_PROP_ID = util.PROPERTY_ID_PREFIX + "*ref";

/** Independent reference to a managed object, list, map, or other managed reference */
export class ManagedReference<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Create a new managed reference that refers to given object */
    constructor(target?: T) {
        super();
        if (target) this.set(target);
    }

    /** Propagate events from referenced objects by emitting them on the reference instance itself, optionally restricted to given types of events or a filter function */
    propagateEvents(f?: ((this: this, e: ManagedEvent) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    /** Propagate events from referenced objects by emitting them on the reference instance itself, optionally restricted to given types of events or a filter function */
    propagateEvents(...types: Array<ManagedEvent | { new(...args: any[]): ManagedEvent }>): this;
    propagateEvents(): this {
        this.propagateChildEvents.apply(this, arguments as any);
        Object.defineProperty(this, util.HIDDEN_NONCHILD_EVENT_HANDLER, {
            configurable: true,
            enumerable: false,
            value: this[util.HIDDEN_CHILD_EVENT_HANDLER]
        });
        return this;
    }

    /**
     * Ensure that referenced object is an instance of given class (or a sub class), and restrict new references to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if referenced object is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedReference<T> {
        let target = this.target;
        if (target && !(target instanceof classType)) {
            throw Error("[Object] Existing reference is not of given type");
        }
        this._managedClassRestriction = classType;
        return this as any;
    }
    private _managedClassRestriction?: ManagedObjectConstructor<any>;

    /** Returns the referenced object, or undefined */
    get(): T | undefined {
        // return referenced object
        let ref = this[util.HIDDEN_REF_PROPERTY][REF_PROP_ID];
        return ref && ref.b;
    }

    /** The referenced object, or undefined */
    get target(): T | undefined {
        // return referenced object
        let ref = this[util.HIDDEN_REF_PROPERTY][REF_PROP_ID];
        return ref && ref.b;
    }
    set target(target: T | undefined) {
        this.set(target);
    }

    /**
     * Remove the current reference, if any.
     * @exception Throws an error if the reference itself has been destroyed (see `ManagedObject.managedState`).
     */
    clear() {
        return this.set();
    }

    /**
     * Set the current reference to given object, or managed list, map, or another reference. Equivalent to setting the `target` property on this instance.
     * @exception Throws an error if the reference itself has been destroyed (see `ManagedObject.managedState`).
     */
    set(target?: T) {
        // check given value first
        ManagedObject._validateReferenceAssignment(this, target, this._managedClassRestriction);

        // unlink existing reference, if any
        let cur = this[util.HIDDEN_REF_PROPERTY][REF_PROP_ID];
        if (cur) {
            if (target && cur.b === target) return;
            ManagedObject._discardRefLink(cur);
        }

        // create new reference and update target count
        if (target) {
            let ref = ManagedObject._createRefLink(this, target, REF_PROP_ID, (_obj, _target, e) => {
                // propagate the event if needed
                if (this[util.HIDDEN_NONCHILD_EVENT_HANDLER]) {
                    this[util.HIDDEN_NONCHILD_EVENT_HANDLER]!(e, "");
                }
                else if (this[util.HIDDEN_CHILD_EVENT_HANDLER]) {
                    this[util.HIDDEN_CHILD_EVENT_HANDLER]!(e, "");
                }
            }, () => {
                // handle target moved/destroyed
                this.emit(ManagedChangeEvent);
            });
            if (this[util.HIDDEN_REF_PROPERTY].parent && !this._isWeakRef) {
                // set/move parent-child link on target object
                ManagedObject._makeManagedChildRefLink(ref);
            }
        }
        this.emit(ManagedChangeEvent.CHANGE);
        return this;
    }

    /** Stop newly referenced objects from becoming child objects even if this `ManagedReference` instance itself is held through a child reference (by a parent object); this can be used to automatically dereference objects when the parent object is destroyed */
    weakRef() {
        this._isWeakRef = true;
        return this;
    }

    /** @internal Helper function that fixes an existing referenced object as a child */
    [util.MAKE_REF_MANAGED_PARENT_FN]() {
        if (this._isWeakRef) return;
        let refs = this[util.HIDDEN_REF_PROPERTY];
        if (refs[REF_PROP_ID]) {
            ManagedObject._makeManagedChildRefLink(refs[REF_PROP_ID]!);
        }
    }

    /** @internal */
    private [util.HIDDEN_NONCHILD_EVENT_HANDLER]?: (e: ManagedEvent, name: string) => void;

    /** Returns the referenced object itself, or undefined (alias of `get()` method) */
    toJSON() {
        let target = this.target;
        return { "$ref": target ? target.managedId : undefined };
    }

    private _isWeakRef?: boolean;
}

/**
 * Managed object property decorator: amend decorated property to turn it into a managed reference to any other managed object (or managed list, map, or reference instance). This allows observers to handle events emitted by the referenced object (see `observe()`).
 *
 * The decorated property immediately becomes undefined when the referenced object is destroyed (see `ManagedObject.managedState`).
 *
 * @decorator
 */
export function managed<T extends ManagedObject>(target: T, propertyKey: any) {
    ManagedObject.createManagedReferenceProperty(target, propertyKey);
}

/**
 * Managed object property decorator: amend decorated property to turn it into a managed reference to any other managed object (or managed list, map, or reference instance). This allows observers to handle events emitted by the referenced object (see `observe()`).
 *
 * This asserts a reverse dependency between the referrer and the referenced object.
 * - The reference _must_ point to an instance of `ManagedObject`, and cannot be set to `undefined`.
 * - When the referenced object is destroyed, the referrer is also destroyed.
 * - An object can contain multiple simultaneous dependencies, and there is no limit on the number of dependents of any referenced object.
 *
 * @decorator
 */
export function managedDependency<T extends ManagedObject>(target: T, propertyKey: any) {
    ManagedObject.createManagedReferenceProperty(target, propertyKey, false, true);
}

/**
 * Managed object property decorator: amend decorated property to turn it into a managed child reference.
 *
 * This asserts a parent-child dependency between the referrer and the referenced object(s), recursively extending to objects in referenced managed lists, maps, and reference instances:
 * - When the parent is destroyed, all children are also destroyed.
 * - When the decorated property is set to another object, the previously referenced object is destroyed.
 * - When the referenced object is assigned to another managed child reference (or list, map, or reference instance that is a child object), the decorated property is set to undefined.
 * - The child object may refer to its parent using the `ManagedObject.getManagedParent` method, and observers can observe the managed parent reference using an `onManagedParentChange[Async]` method.
 *
 * @decorator
 */
export function managedChild<T extends ManagedObject>(target: T, propertyKey: any) {
    ManagedObject.createManagedReferenceProperty(target, propertyKey, true);
}
