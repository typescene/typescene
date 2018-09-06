import { Binding } from "./Binding";
import { ManagedEvent, ManagedParentChangeEvent } from "./ManagedEvent";
import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject, ManagedState } from "./ManagedObject";
import { managedChild } from "./ManagedReference";
import { observe, onPropertyChange } from "./observe";
import { logUnhandledException } from "./UnhandledErrorEmitter";

/** Running ID used by `presetBindingsFrom` */
let _presetBindingsFromID = 0;

/** Event that is emitted on a particular `Component` instance */
export class ComponentEvent extends ManagedEvent {
    constructor(name: string, source: Component, inner?: ManagedEvent) {
        super(name);
        this.source = source;
        this.inner = inner;
    }

    /** Source component */
    source: Component;

    /** Encapsulated event (i.e. propagated event if this event was emitted by `Component.propagateComponentEvent`) */
    inner?: ManagedEvent;
}

/**
 * Generic constructor type for Component, matching both parameterless constructors and those with one or more required parameters.
 * For a constructable type, combine with a specific function type, e.g. `ComponentConstructor & (new () => MyComponent)`.
 */
export type ComponentConstructor<TComponent extends Component = Component> =
    (new (...args: any[]) => TComponent) |
    (new (a: never, b: never, c: never, d: never, e: never, f: never) => TComponent);

/** Inferred type of the argument to `Component.with` for a specific component constructor */
export type ComponentPresetType<TComponentCtor extends ComponentConstructor> =
    TComponentCtor extends { preset: (presets: infer TPreset) => void } ? TPreset : any;

/** Inferred type of the rest arguments to `Component.with` for a specific component constructor */
export type ComponentPresetRestType<TComponentCtor extends ComponentConstructor> =
    TComponentCtor extends { preset: (presets: ComponentPresetType<TComponentCtor>, ...rest: infer TRest) => void } ? TRest : never;

/** @internal Event that is emitted on (parent) components when a child component is added. The parent component observer responds by setting the `parentObserver` property on the child observer. */
export class ComponentChildAddedEvent extends ComponentEvent {
    constructor(observer: ComponentObserver) {
        super("ChildComponentAdded", observer.component);
        this.observer = observer;
    }

    /** The observer for the new child component */
    readonly observer: ComponentObserver;
}

/** @internal Event that is emitted when the composite parent object reference has been set for a component */
export class CompositeParentChangeEvent extends ComponentEvent {
    constructor(component: Component, composite?: Component) {
        super("CompositeParentChange", component);
        this.composite = composite;
    }

    /** The composite parent object reference */
    composite?: Component;
}

/** Represents an object that can be initialized from a static structure, optionally containing nested components which may contain bindings to properties on the composite parent object (see `@compose` decorator). */
export class Component extends ManagedObject {
    /**
     * Create a new constructor, for which instances are automatically updated with given properties, bindings, event handlers, and other values.
     * - When an instance is activated, components included as preset properties are instantiated and assigned to properties with the same name as the preset object property.
     * - When an instance becomes a (nested) child component of an active _composite object_ (or upon activation of such an object), bindings are activated to reflect values from the composite object.
     * - Event handlers are added on all instances of the component class, using one of the following patterns:
     *   * `{ ... onEventName: "methodName()" }` to invoke given method directly on the first composite object that defines a method with this name, whenever an event with given name is emitted, passing the event as the first and only argument, or
     *   * `{ ... onEventName: "+OtherEvent" }` to emit another event with given name. The event is created and emitted using the `Component.propagateComponentEvent` method.
     * - Upon initialization of each instance, the `update` method is called with the remaining properties in the intializer argument, and all rest arguments (component classes) of the same type as the arguments to this method.
     */
    static with<TComponentCtor extends ComponentConstructor,
        TPreset extends ComponentPresetType<TComponentCtor>,
        TRest extends ComponentPresetRestType<TComponentCtor>>(
        this: TComponentCtor & { preset(presets: TPreset): Function },
        presets: { [P in keyof TPreset]?: TPreset[P] | { isComponentBinding(): true } } &
            { [other: string]: any, with?: never },
        ...rest: TRest):
        TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor,
        TRest extends ComponentPresetRestType<TComponentCtor>>(
        this: TComponentCtor & { preset: Function },
        ...rest: TRest):
        TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor,
        TPreset extends ComponentPresetType<TComponentCtor>,
        TRest extends ComponentPresetRestType<TComponentCtor>>(
        this: TComponentCtor & { preset(presets: TPreset): Function },
        presets: { [P in keyof TPreset]?: TPreset[P] | { isComponentBinding(): true } } & { with?: never },
        ...rest: TRest):
        TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor,
        TPreset extends ComponentPresetType<TComponentCtor>>(
        this: TComponentCtor & { preset(presets: TPreset): Function },
        ...presets: any[]):
        TComponentCtor {
        // create a new class that extends the current class
        let Self: new (...args: any[]) => Component = this as any;
        let presetFunc: (this: Component) => void;
        class PresetComponent extends Self {
            constructor(...args: any[]) {
                // call super first, then own preset function
                super(...args);
                presetFunc.call(this);
            }
            protected isPresetComponent() { return true }
        }

        // combine arguments into single preset and rest arguments
        let presetArgs: any[] = [{}];
        for (let v of presets) {
            if (typeof v === "object" &&
                Object.getPrototypeOf(v) === Object.prototype) {
                // plain object: add properties to preset object
                presetArgs[0] = { ...presetArgs[0], ...(v as {}) };
            }
            else {
                // add as rest argument
                presetArgs.push(v);
            }
        }

        // apply static elements to the new constructor and return it
        presetFunc = this.preset.apply(PresetComponent, presetArgs);
        return PresetComponent as any;
    }

    /**
     * Add bindings, components, and event handlers from given presets to the current component constructor. This method is called by `Component.with`, and should be called by all derived classes as well, through `super`.
     * Any rest parameters accepted by overriding methods are passed down from `Component.with` as well, except plain objects which are interpreted as preset objects.
     * @returns A function (*must* be typed as `Function` even in derived classes) that is called by the constructor for each new instance, to apply remaining values from the preset object to the component object that is passed through `this`.
     */
    static preset(presets: object, ...rest: unknown[]): Function {
        // take and apply bindings and components to the constructor already
        let eventHandlers: { [eventName: string]: (this: Component, e: any) => void } | undefined;
        for (let p in presets) {
            let v = (presets as any)[p];
            if (Binding.isBinding(v)) {
                // add binding to constructor and remove from presets
                this.presetBinding(p, v);
                delete (presets as any)[p];
            }
            else if (v && p[0] === "o" && p[1] === "n" &&
                (p.charCodeAt(2) < 97 || p.charCodeAt(2) > 122)) {
                // add event handlers to object
                if (!eventHandlers) eventHandlers = {};
                eventHandlers[p.slice(2)] = (typeof v === "function") ? v :
                    this._makeEventHandler(String(v));
                delete (presets as any)[p];
            }
            else if (typeof v === "function" && (v.prototype instanceof Component)) {
                // add bindings for component constructor
                rest.push(v);
            }
        }
        // register bindings for child components, if any
        if (rest.length) this.presetBindingsFrom(...rest as any);
        
        // add event handlers, if any
        if (eventHandlers) {
            this.handle(eventHandlers);
        }

        // return a function that applies remaining properties to new instances
        return function (this: Component) {
            for (let p in presets) {
                let v = (presets as any)[p];
                if (v !== undefined) this._applyPropertyValue(p as any, v);
            }
        }
    }

    /** Add given binding to this component constructor, so that the property with given name *on all instances* will be updated with value(s) taken from the parent composite object. Optionally given function is used to set the property value using the updated (bound) value; otherwise, values are copied directly except for arrays, which are used to replace the values in a managed list (see `ManagedList.replace`). */
    static presetBinding<TComponent extends Component>(
        this: ComponentConstructor<TComponent>,
        propertyName: string, binding: Binding,
        applyBoundValue?: (this: TComponent, boundValue: any) => any) {
        // add binding to list
        let ownBindings = this.prototype.getOwnBindings();
        ownBindings = { ...ownBindings, [propertyName!]: binding };
        this.prototype.getOwnBindings = () => ownBindings;

        // provide a method to update property values
        if (!applyBoundValue) {
            applyBoundValue = function (this: Component, v: any) {
                this._applyPropertyValue(propertyName as any, v);
            }
        }
        Object.defineProperty(this.prototype, binding.id, {
            configurable: true, enumerable: false, writable: false,
            value: applyBoundValue
        });
    }

    /** Inherit bindings from given component constructor(s) on this constructor, so that all inherited bindings will be bound on the parent composite object and (nested) child instances of given constructors can be updated as and when needed. */
    static presetBindingsFrom(...constructors: Array<ComponentConstructor | undefined>) {
        let ownBindings = { ...this.prototype.getOwnBindings() };
        for (let C of constructors) {
            // add constructor to list
            if (C) ownBindings["@{bind}__" + _presetBindingsFromID++] = C;
        }
        this.prototype.getOwnBindings = () => ownBindings;
    }

    /**
     * Add a sub component to this component that is automatically constructed when this component is activated, using given constructor. This component will serve as the composite parent object of all instances (i.e. the target object for all bindings on the component and child components). Sub components are destroyed immediately when the component is deactivated or destroyed.
     * In addition, bindings on all other component classes passed as rest parameters are added on this composite component. This may be necessary if further nested components are added dynamically (e.g. as nested children) and the component constructor itself does not include all of the same bindings.
     * Given properties must *already* be decorated with the `@managedChild` decorator. This method is intended for use by `Component.preset`.
     */
    static presetActiveComponent(propertyName: string,
        constructor: ComponentConstructor & (new () => Component),
        ...include: ComponentConstructor[]) {
        if (!(constructor.prototype instanceof Component)) {
            throw Error("[Component] Invalid component type for property: " + propertyName);
        }
        this._components = this._components ? { ...this._components } : {};
        if (this._components[propertyName] === constructor) return;
        this._components[propertyName] = constructor;

        // find all (nested) component bindings recursively
        let bindings: Binding[] = [];
        let addBindings = (C: ComponentConstructor, q: string) => {
            let b = (C.prototype as Component).getOwnBindings.call(undefined);
            for (let p in b) {
                if (typeof b[p] === "function") addBindings(b[p], q + ":" + p);
                else {
                    let binding: Binding = b[p];
                    bindings.push(binding);
                    if (binding.bindings) bindings.push(...binding.bindings);
                }
            }
        };
        addBindings(constructor, propertyName);
        include.forEach(C => addBindings(C, "?"));

        // get a list of all properties that should be observed
        let propertiesToObserve = bindings
            .filter(b => (b.propertyName !== undefined))
            .map(b => b.propertyName!);
        
        // use a specific observer for these components
        let self = this;
        class CompositeObserver {
            constructor(public component: Component) {
                if (this.component.managedState === ManagedState.ACTIVE) {
                    // observer created for active component
                    this.onActive();
                }
            }

            /** True if the child components currently exist */
            active?: boolean;
            
            /** Create the component when the composite is activated */
            onActive() {
                if (!this.active &&
                    this.component.managedState === ManagedState.ACTIVE &&
                    self._components[propertyName] === constructor) {
                    try {
                        this.active = true;
                        let allBound = this.component._getCompositeBindings();
                        allBound.bind(bindings);
                        let c = new constructor();
                        c.setCompositeParent(this.component);
                        (this.component as any)[propertyName] = c;
                    }
                    catch (err) { logUnhandledException(err) }
                }
            }

            /** Destroy the component when the composite is deactivated */
            onInactive() {
                if (this.active &&
                    this.component.managedState !== ManagedState.ACTIVE) {
                    this.active = false;
                    (this.component as any)[propertyName] = undefined;
                    this.component._getCompositeBindings().clearBindings();
                }
            }

            /** Handle bound property changes (on _instance_) */
            @onPropertyChange(...propertiesToObserve)
            updatePropertyAsync(v: any, _e: any, name: string) {
                if (this.active) {
                    this.component._getCompositeBindings().update(name, v);
                }
            }

            /** Handle overall changes (update all bindings) */
            onChangeAsync() {
                if (this.active) {
                    this.component._getCompositeBindings().update();
                }
            }
        }
        this.observe(CompositeObserver);
    }

    /** All component constructors that have been added by the static `presetActiveComponent` method */
    private static _components: { [name: string]: any };

    /** Create a new component */
    constructor() {
        super();
    }

    /** Returns true if the class that this instance has been created from was itself created using `Component.with` somewhere along the prototype chain. */
    protected isPresetComponent() { return false }

    /** Returns the current parent component. See `@managedChild` decorator. */
    getParentComponent(): Component | undefined;
    /** Returns the current parent component. See `@managedChild` decorator. */
    getParentComponent<TParent extends Component>(ParentClass: ComponentConstructor<TParent>): TParent | undefined;
    getParentComponent(ParentClass: any = Component) {
        return this.getManagedParent(ParentClass);
    }

    /**
     * Returns the parent component that contains the `@compose` property which references this component (or the parent's parent if this component's parent is referenced by a `@compose` property instead, and so on).
     * If there is no component that (indirectly) references this component through a `@compose` property, this method returns undefined.
     */
    getCompositeParent<TParent extends Component>(
        ParentClass?: ComponentConstructor<TParent>): TParent | undefined {
        if (!ParentClass) return this._compositeParent as any;
        let cur = this._compositeParent;
        while (cur && !(cur instanceof ParentClass)) {
            cur = cur.getCompositeParent();
        }
        return cur as any;
    }

    /** @internal Set the composite parent reference for this component (and all child components, through an event that is propagated on the component observer), and update all bindings. */
    setCompositeParent(composite?: Component, quiet?: boolean) {
        if (this._compositeParent === composite) return;
        Object.defineProperty(this, "_compositeParent", {
            configurable: true, writable: true, enumerable: false
        });
        this._compositeParent = composite;
        if (!quiet) {
            this.emit(CompositeParentChangeEvent, this, composite);
        }

        // clear current bindings, if any
        if (this._componentBindings) {
            for (let bound of this._componentBindings) {
                bound.remove(this);
            }
        }

        // preset bindings on new composite component
        if (composite && composite !== this) {
            let ownBindings = this.getOwnBindings();
            Object.defineProperty(this, "_componentBindings", {
                enumerable: false, writable: false,
                configurable: true,
                value: []
            });
            for (let p in ownBindings) {
                // add this component to bound instance
                let binding = ownBindings[p];
                if (!Binding.isBinding(binding)) continue;
                let bound = this.getBoundBinding(binding);
                if (!bound) {
                    throw TypeError("[Component] Binding not found for " + p);
                }
                this._componentBindings!.push(bound);
                bound.add(this);

                // update bound value now
                if (typeof (this as any)[binding.id] === "function") {
                    (this as any)[binding.id](bound.value);
                }
            }
        }
        else {
            // not bound at all (anymore)
            delete this._componentBindings;
        }
    }

    /** Reference to the current composite parent, set by the base component observer */
    private _compositeParent?: Component;

    /** List of bindings currently bound to update this component */
    private _componentBindings?: Binding.Bound[];

    /** @internal Returns a bound binding for given instance, either bound on this component or its composite parent(s) */
    getBoundBinding(binding: Binding): Binding.Bound | undefined {
        return this._compositeBindings &&
            this._compositeBindings.getBoundBinding(binding) ||
            (this._compositeParent && this._compositeParent.getBoundBinding(binding));
    }

    /** Returns an encapsulation of the bindings for this component as a composite object, created when this method is first called. */
    private _getCompositeBindings() {
        if (!this._compositeBindings) {
            Object.defineProperty(this, "_compositeBindings", {
                enumerable: false, writable: false,
                value: new CompositeBindings(this)
            });
        }
        return this._compositeBindings!;
    }

    private readonly _compositeBindings?: CompositeBindings;

    /** @internal Returns the list of bindings applied to this component, along with all component constructors whose bindings should be bound to the same parent composite object */
    getOwnBindings(): Readonly<{ [key: string]: Binding | ComponentConstructor }> { return {} }

    /**
     * Create and emit an event with given name and a reference to this component. The base implementation emits a plain `ComponentEvent`, but this method may be overridden to emit other events.
     * This method is used by classes created using `Component.with` if an event handler is specified using the `{ ... onEventName: "+OtherEvent" }` pattern.
     */
    public propagateComponentEvent(name: string, inner?: ManagedEvent) {
        this.emit(ComponentEvent, name, this, inner);
    }

    /** @internal Helper function to register a new child component observer */
    ["*registerChildComponent"](observer: ComponentObserver) {
        this.emit(ComponentChildAddedEvent, observer);
    }

    /** Helper method to update a property of this object with given value, with some additional logic for managed lists */
    private _applyPropertyValue(p: keyof this, v: any) {
        let c = this[p];
        if (c && (c instanceof ManagedList) && Array.isArray(v)) {
            // update managed lists with array items
            c.replace(v);
        }
        else {
            // set property value
            this[p] = v;
        }
    }

    /** Helper function to make an event handler from a preset string property */
    private static _makeEventHandler(handler: string) {
        if (handler.slice(-2) === "()") {
            let callMethodName = handler.slice(0, -2);
            return function (this: Component, e: ManagedEvent) {
                let composite: any = this.getCompositeParent();
                while (composite) {
                    let f = composite && composite[callMethodName];
                    if (typeof f === "function") return f.call(composite, e);
                    composite = composite.getCompositeParent();
                }
                throw TypeError("[Component] " +
                    "Not an event handler method: " + callMethodName);
            }
        }
        else if (handler[0] === "+") {
            let emitName = handler.slice(1);
            return function (this: Component, e: ManagedEvent) {
                this.propagateComponentEvent(emitName, e);
            };
        }
        else {
            throw Error("[Component] Invalid event handler preset: "
                + handler);
        }
    }
}

/** @internal Encapsulation of bindings that are bound to an active composite component object, created for components when first requested. See `Component.getCompositeBindings`. */
class CompositeBindings {
    constructor(component: Component) {
        this.component = component;
    }

    /** The composite component object itself */
    readonly component: Component;

    /** Returns the bound instance of given binding, if any */
    getBoundBinding(binding: Binding) {
        return this._bound.get(binding.id);
    }

    /** Remove all bound bindings */
    clearBindings() {
        this._bound.clear();
    }

    /** Bind given bindings and add them to this instance */
    bind(bindings: Binding[]) {
        for (let binding of bindings) {
            if (!this._bound.has(binding.id)) {
                let bound = new Binding.Bound(binding, this.component);
                this._bound.set(binding.id, bound);
            }
        }
    }

    /** Update any and all bound bindings that depend on the composite property with given name (or all properties if no name is given). The value of the composite object property may be specified if it is known. */
    update(propertyName?: string, v?: any) {
        // find bindings for given property name and update all bound components
        for (let bound of this._bound.objects()) {
            if (propertyName === undefined || bound.propertyName === propertyName) {
                arguments.length > 1 ?
                    bound.updateComponents(v) :
                    bound.updateComponents();
            }
        }
        return this;
    }

    /** Index of all bound bindings, by binding ID */
    private _bound = new ManagedMap<Binding.Bound>();
}

/** @internal Base component observer, which observes parent references for all components */
@observe(Component)
class ComponentObserver<TComponent extends Component = Component> extends ManagedObject {
    constructor(component: TComponent) {
        super();
        ManagedObject.createManagedReferenceProperty(this, "parent", false, false, undefined,
            event => { if (event instanceof CompositeParentChangeEvent) this.emit(event) });
        this.component = component;
    }

    /** The observed component itself */
    readonly component: TComponent;

    /** The parent component observer, if any */
    parent?: ComponentObserver;

    /** Respond to events on the component itself */
    onEvent(e: ManagedEvent) {
        if (e instanceof ComponentChildAddedEvent) {
            // Respond to new child components by setting the managed back reference,
            // so that the CompositeParentChange event can be propagated
            if (e.observer) e.observer.parent = this;
        }
        else if (e instanceof ManagedParentChangeEvent) {
            // Respond to parent component changes to find the parent observer
            let parentComponent = this.component.getParentComponent();
            this.parent = undefined;
            if (parentComponent) {
                // let the parent observer attach itself to this observer (sync)
                parentComponent["*registerChildComponent"](this);

                // check if parent already has a composite and it is different
                // from the current composite object (unless the parent itself
                // has already been set as the current composite object)
                let parentComposite = parentComponent.getCompositeParent();
                let observedComposite = this.component.getCompositeParent();
                if (parentComposite !== observedComposite &&
                    observedComposite !== parentComponent) {
                    // set reference, and trigger an event on the component
                    this.component.setCompositeParent(parentComposite);
                }
            }
        }
        else if (e instanceof CompositeParentChangeEvent) {
            // Propagate changes to the composite parent
            // on all child component _observers_
            this.emit(e);
        }
    }
}
ComponentObserver.handle({
    // propagate composite reference after event on component observer itself
    CompositeParentChange(e: ManagedEvent) {
        if ((e instanceof CompositeParentChangeEvent) &&
            e.source !== this.component) {
            // set the composite parent reference on the observed component, but
            // do not emit an event on this component since already propagated
            this.component.setCompositeParent(e.composite, true);
        }
    }
});

/**
 * Property decorator: turn the decorated property into an active sub component reference, with the containing object as its composite parent (i.e. the target object for all bindings on the component and child components). Given constructor is used to create a sub component instance *when the containing component is activated*, and sub components are destroyed immediately when the component is deactivated or destroyed.
 * In addition, bindings on all other component classes passed as rest parameters are added on this composite component. This may be necessary if further nested components are added dynamically (e.g. as nested children) and the component constructor itself does not include all of the same bindings.
 * @decorator
 */
export function compose(constructor: ComponentConstructor & (new () => Component),
    ...include: ComponentConstructor[]) {
    return function<T extends ManagedObject>(target: T, propertyKey: any) {
        managedChild(target, propertyKey);
        (target.constructor as typeof Component).presetActiveComponent(propertyKey, constructor, ...include);
    }
}
