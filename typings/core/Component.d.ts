import { Binding } from "./Binding";
import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject } from "./ManagedObject";
/** Event that is emitted on a particular `Component` instance */
export declare class ComponentEvent extends ManagedEvent {
    constructor(name: string, source: Component, inner?: ManagedEvent);
    /** Source component */
    source: Component;
    /** Encapsulated event (i.e. propagated event if this event was emitted by `Component.propagateComponentEvent`) */
    inner?: ManagedEvent;
}
/**
 * Generic constructor type for Component, matching both parameterless constructors and those with one or more required parameters.
 * For a constructable type, combine with a specific function type, e.g. `ComponentConstructor & (new () => MyComponent)`.
 */
export declare type ComponentConstructor<TComponent extends Component = Component> = (new (...args: any[]) => TComponent) | (new (a: never, b: never, c: never, d: never, e: never, f: never) => TComponent);
/** Inferred type of the argument to `Component.with` for a specific component constructor */
export declare type ComponentPresetType<TComponentCtor extends ComponentConstructor> = TComponentCtor extends {
    preset: (presets: infer TPreset) => void;
} ? TPreset : any;
/** Inferred type of the rest arguments to `Component.with` for a specific component constructor */
export declare type ComponentPresetRestType<TComponentCtor extends ComponentConstructor> = TComponentCtor extends {
    preset: (presets: ComponentPresetType<TComponentCtor>, ...rest: infer TRest) => void;
} ? TRest : never;
/** @internal Event that is emitted on (parent) components when a child component is added. The parent component observer responds by setting the `parentObserver` property on the child observer. */
export declare class ComponentChildAddedEvent extends ComponentEvent {
    constructor(observer: ComponentObserver);
    /** The observer for the new child component */
    readonly observer: ComponentObserver;
}
/** @internal Event that is emitted when the composite parent object reference has been set for a component */
export declare class CompositeParentChangeEvent extends ComponentEvent {
    constructor(component: Component, composite?: Component);
    /** The composite parent object reference */
    composite?: Component;
}
/** Represents an object that can be initialized from a static structure, optionally containing nested components which may contain bindings to properties on the composite parent object (see `@compose` decorator). */
export declare class Component extends ManagedObject {
    /**
     * Create a new constructor, for which instances are automatically updated with given properties, bindings, event handlers, and other values.
     * - When an instance is activated, components included as preset properties are instantiated and assigned to properties with the same name as the preset object property.
     * - When an instance becomes a (nested) child component of an active _composite object_ (or upon activation of such an object), bindings are activated to reflect values from the composite object.
     * - Event handlers are added on all instances of the component class, using one of the following patterns:
     *   * `{ ... onEventName: "methodName()" }` to invoke given method directly on the first composite object that defines a method with this name, whenever an event with given name is emitted, passing the event as the first and only argument, or
     *   * `{ ... onEventName: "+OtherEvent" }` to emit another event with given name. The event is created and emitted using the `Component.propagateComponentEvent` method.
     * - Upon initialization of each instance, the `update` method is called with the remaining properties in the intializer argument, and all rest arguments (component classes) of the same type as the arguments to this method.
     */
    static with<TComponentCtor extends ComponentConstructor, TPreset extends ComponentPresetType<TComponentCtor>, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset(presets: TPreset): Function;
    }, presets: {
        [P in keyof TPreset]?: TPreset[P] | {
            isComponentBinding(): true;
        };
    } & {
        [other: string]: any;
        with?: never;
    }, ...rest: TRest): TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset: Function;
    }, ...rest: TRest): TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor, TPreset extends ComponentPresetType<TComponentCtor>, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset(presets: TPreset): Function;
    }, presets: {
        [P in keyof TPreset]?: TPreset[P] | {
            isComponentBinding(): true;
        };
    } & {
        with?: never;
    }, ...rest: TRest): TComponentCtor;
    /**
     * Add bindings, components, and event handlers from given presets to the current component constructor. This method is called by `Component.with`, and should be called by all derived classes as well, through `super`.
     * Any rest parameters accepted by overriding methods are passed down from `Component.with` as well, except plain objects which are interpreted as preset objects.
     * @returns A function (*must* be typed as `Function` even in derived classes) that is called by the constructor for each new instance, to apply remaining values from the preset object to the component object that is passed through `this`.
     */
    static preset(presets: object, ...rest: unknown[]): Function;
    /** Add given binding to this component constructor, so that the property with given name *on all instances* will be updated with value(s) taken from the parent composite object. Optionally given function is used to set the property value using the updated (bound) value; otherwise, values are copied directly except for arrays, which are used to replace the values in a managed list (see `ManagedList.replace`). */
    static presetBinding<TComponent extends Component>(this: ComponentConstructor<TComponent>, propertyName: string, binding: Binding, applyBoundValue?: (this: TComponent, boundValue: any) => any): void;
    /** Inherit bindings from given component constructor(s) on this constructor, so that all inherited bindings will be bound on the parent composite object and (nested) child instances of given constructors can be updated as and when needed. */
    static presetBindingsFrom(...constructors: Array<ComponentConstructor | undefined>): void;
    /**
     * Add a sub component to this component that is automatically constructed when this component is activated, using given constructor. This component will serve as the composite parent object of all instances (i.e. the target object for all bindings on the component and child components). Sub components are destroyed immediately when the component is deactivated or destroyed.
     * In addition, bindings on all other component classes passed as rest parameters are added on this composite component. This may be necessary if further nested components are added dynamically (e.g. as nested children) and the component constructor itself does not include all of the same bindings.
     * Given properties must *already* be decorated with the `@managedChild` decorator. This method is intended for use by `Component.preset`.
     */
    static presetActiveComponent(propertyName: string, constructor: ComponentConstructor & (new () => Component), ...include: ComponentConstructor[]): void;
    /** All component constructors that have been added by the static `presetActiveComponent` method */
    private static _components;
    /** Create a new component */
    constructor();
    /** Returns true if the class that this instance has been created from was itself created using `Component.with` somewhere along the prototype chain. */
    protected isPresetComponent(): boolean;
    /** Returns the current parent component. See `@managedChild` decorator. */
    getParentComponent(): Component | undefined;
    /** Returns the current parent component. See `@managedChild` decorator. */
    getParentComponent<TParent extends Component>(ParentClass: ComponentConstructor<TParent>): TParent | undefined;
    /**
     * Returns the parent component that contains the `@compose` property which references this component (or the parent's parent if this component's parent is referenced by a `@compose` property instead, and so on).
     * If there is no component that (indirectly) references this component through a `@compose` property, this method returns undefined.
     */
    getCompositeParent<TParent extends Component>(ParentClass?: ComponentConstructor<TParent>): TParent | undefined;
    /** @internal Set the composite parent reference for this component (and all child components, through an event that is propagated on the component observer), and update all bindings. */
    setCompositeParent(composite?: Component, quiet?: boolean): void;
    /** Reference to the current composite parent, set by the base component observer */
    private _compositeParent?;
    /** List of bindings currently bound to update this component */
    private _componentBindings?;
    /** @internal Returns a bound binding for given instance, either bound on this component or its composite parent(s) */
    getBoundBinding(binding: Binding): Binding.Bound | undefined;
    /** Returns an encapsulation of the bindings for this component as a composite object, created when this method is first called. */
    private _getCompositeBindings;
    private readonly _compositeBindings?;
    /** @internal Returns the list of bindings applied to this component, along with all component constructors whose bindings should be bound to the same parent composite object */
    getOwnBindings(): Readonly<{
        [key: string]: Binding | ComponentConstructor;
    }>;
    /**
     * Create and emit an event with given name and a reference to this component. The base implementation emits a plain `ComponentEvent`, but this method may be overridden to emit other events.
     * This method is used by classes created using `Component.with` if an event handler is specified using the `{ ... onEventName: "+OtherEvent" }` pattern.
     */
    propagateComponentEvent(name: string, inner?: ManagedEvent): void;
    /** @internal Helper function to register a new child component observer */
    ["*registerChildComponent"](observer: ComponentObserver): void;
    /** Helper method to update a property of this object with given value, with some additional logic for managed lists */
    private _applyPropertyValue;
    /** Helper function to make an event handler from a preset string property */
    private static _makeEventHandler;
}
/** @internal Base component observer, which observes parent references for all components */
declare class ComponentObserver<TComponent extends Component = Component> extends ManagedObject {
    constructor(component: TComponent);
    /** The observed component itself */
    readonly component: TComponent;
    /** The parent component observer, if any */
    parent?: ComponentObserver;
    /** Respond to events on the component itself */
    onEvent(e: ManagedEvent): void;
}
/**
 * Property decorator: turn the decorated property into an active sub component reference, with the containing object as its composite parent (i.e. the target object for all bindings on the component and child components). Given constructor is used to create a sub component instance *when the containing component is activated*, and sub components are destroyed immediately when the component is deactivated or destroyed.
 * In addition, bindings on all other component classes passed as rest parameters are added on this composite component. This may be necessary if further nested components are added dynamically (e.g. as nested children) and the component constructor itself does not include all of the same bindings.
 * @decorator
 */
export declare function compose(constructor: ComponentConstructor & (new () => Component), ...include: ComponentConstructor[]): <T extends ManagedObject>(target: T, propertyKey: any) => void;
export {};
