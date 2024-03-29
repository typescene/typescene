import { err, ERROR } from "../errors";
import { HIDDEN, defineChainableProperty, exceptionHandler } from "./util";
import { Binding } from "./Binding";
import { ManagedEvent, ManagedParentChangeEvent, ManagedCoreEvent } from "./ManagedEvent";
import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";
import { onPropertyChange, observe } from "./observe";

/** Event that is emitted on a particular `Component` instance, with reference to the source component as `source` */
export class ComponentEvent<TComponent extends Component = Component> extends ManagedEvent {
  /** Create a new event with given name, source, and optionally encapsulated event */
  constructor(name: string, source: TComponent, inner?: ManagedEvent) {
    super(name);
    this.source = source;
    this.inner = inner;
  }

  /** Source component */
  source: TComponent;

  /** Encapsulated event, if the event was originally of a different type */
  inner?: ManagedEvent;
}

/** Event handler type, can be used to define the type of a preset event handler as a string or function */
export type ComponentEventHandler<TComponent = Component, TEvent = ComponentEvent> =
  | string
  | ((this: TComponent, e: TEvent) => void);

/**
 * Component-specific event that represents the result of a user action, with reference to the source component and optional additional context. Actions are intended to be handled by parent components, or propagated further up the component hierarchy by re-emitting them (default behavior for `Component.delegateEvent`).
 * @note This event type is used when handling events using _preset_ components, using e.g. `{ "onClick": "EventName" }`. The method `Component.emitAction()` can also be used to emit action events.
 */
export class ActionEvent<
  TComponent extends Component = Component,
  TContext extends ManagedObject = ManagedObject
> extends ComponentEvent<TComponent> {
  /** Action context (if different from `source` component) */
  context?: TContext;
}

/** Generic constructor type for Component classes */
export type ComponentConstructor<TComponent extends Component = Component> = new (
  ...args: never[]
) => TComponent;

export namespace ComponentConstructor {
  /** Inferred partial type of the argument to `Component.with` without bindings, for a specific component constructor */
  export type PresetType<TComponentCtor extends ComponentConstructor> =
    TComponentCtor extends { preset: (presets: infer TPreset) => void } ? TPreset : any;

  /** Inferred type of the argument to `Component.with` for a specific component constructor */
  export type PresetArgType<TComponentCtor extends ComponentConstructor> = {
    [P in keyof PresetType<TComponentCtor>]?: PresetType<TComponentCtor>[P] | Binding.Type;
  } & {
    [P: string]: any;
  };

  /** Inferred type of the rest arguments to `Component.with` for a specific component constructor */
  export type PresetRestType<TComponentCtor extends ComponentConstructor> =
    TComponentCtor extends {
      preset: (presets: PresetType<TComponentCtor>, ...components: infer TRest) => void;
    }
      ? TRest
      : never;

  export type WithPresetType<TComponentCtor extends ComponentConstructor> =
    TComponentCtor & { preset(presets: PresetType<TComponentCtor>): Function };
}

/** @internal Event that is emitted on (parent) components when a child component is added. The parent component observer responds by setting the `parentObserver` property on the child observer. */
export class ComponentChildAddedEvent extends ManagedEvent {
  constructor(observer: Component.ComponentObserver) {
    super("ChildComponentAdded");
    this.source = observer.component;
    this.observer = observer;
  }

  /** Source (added) component */
  source: Component;

  /** The observer for the new child component */
  readonly observer: Component.ComponentObserver;
}

/** @internal Event that is emitted when the composite parent object reference has been set for a component */
export class CompositeParentChangeEvent extends ManagedEvent {
  constructor(component: Component, composite?: Component) {
    super("CompositeParentChange");
    this.source = component;
    this.composite = composite;
  }

  /** Source component (with new parent) */
  source: Component;

  /** The composite parent object reference */
  composite?: Component;
}

/**
 * Component base class. Represents a managed object (see `ManagedObject`) that can be instantiated using a 'preset' constructor, i.e. the result of a call to the static `with` method.
 * When components are constructed, they are initialized with preset values for given properties, as well as preset bindings for properties which should automatically observe properties on the nearest parent component that (indirectly) references this component using the `@managedBound` decorator.
 */
export class Component extends ManagedObject {
  /** Create a new component constructor, which automatically initializes new instances with given properties, bindings, event handlers, and other values. */
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentConstructor.WithPresetType<TComponentCtor>,
    ...components: ComponentConstructor.PresetRestType<TComponentCtor>
  ): TComponentCtor;
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentConstructor.WithPresetType<TComponentCtor>,
    presets: new () => any,
    ...components: ComponentConstructor.PresetRestType<TComponentCtor>
  ): "INVALID_PRESET_ARGUMENT";
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentConstructor.WithPresetType<TComponentCtor>,
    presets: ComponentConstructor.PresetArgType<TComponentCtor>,
    ...components: ComponentConstructor.PresetRestType<TComponentCtor>
  ): TComponentCtor;
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentConstructor.WithPresetType<TComponentCtor>,
    ...presets: any[]
  ): TComponentCtor {
    // create a new class that extends the current class
    let Self: new (...args: any[]) => Component = this as any;
    let presetFunc: Function;
    class PresetComponent extends Self {
      static preset: typeof Component.preset;
      constructor(...args: any[]) {
        // call super first, then own preset function
        super(...args);
        presetFunc.call(this);
      }
      protected isPresetComponent() {
        return true;
      }
    }

    // call preset method and store result for use above
    let obj: any = presets[0];
    let objPrototype = Object.getPrototypeOf(obj);
    if (typeof obj !== "object" || (objPrototype && objPrototype !== Object.prototype)) {
      presetFunc = PresetComponent.preset(Object.create(null), ...presets);
    } else {
      presetFunc = PresetComponent.preset(...(presets as [{}]));
    }

    // return the extended class
    return PresetComponent as any;
  }

  /**
   * Add bindings, components, and event handlers from given presets to the current component constructor. This method is called by `Component.with` with the same arguments, and should not be called directly.
   * Component classes may override this method and return the result of `super.preset(...)`, to add further presets and bindings using static methods on this component class.
   * @returns A function (*must* be typed as `Function` even in derived classes) that is called by the constructor for each new instance, to apply remaining values from the preset object to the component object that is passed through `this`.
   */
  static preset(presets: object, ...components: unknown[]): Function {
    // take and apply bindings and components to the constructor already
    let eventActions: { [eventName: string]: string } | undefined;
    let eventHandlers:
      | { [eventName: string]: (this: Component, e: any) => void }
      | undefined;
    for (let p in presets) {
      let v = (presets as any)[p];
      if (Binding.isBinding(v)) {
        // add binding to constructor and remove from presets
        this.presetBinding(p, v);
        delete (presets as any)[p];
      } else if (v && p[0] === "o" && p[1] === "n" && (p[2] < "a" || p[2] > "z")) {
        // add action to propagate (event name starting with capital letter)
        if (typeof v === "string" && (v[0] < "a" || v[0] > "z")) {
          if (v[0] === "+") v = v.slice(1);
          if (!eventActions) eventActions = Object.create(null);
          eventActions![p.slice(2)] = v;
        } else {
          // add event handler directly
          if (!eventHandlers) eventHandlers = Object.create(null);
          eventHandlers![p.slice(2)] =
            typeof v === "function" ? v : _makeEventHandler(String(v));
        }
        delete (presets as any)[p];
      } else if (typeof v === "function" && v.prototype instanceof Component) {
        // add bindings for component constructor
        components.push(v);
      }
    }
    // register bindings for child components, if any
    if (components.length) this.presetBindingsFrom(...(components as any));

    // add event handlers, if any
    if (eventActions) {
      this.addEventHandler(function (e) {
        let actionName = eventActions![e.name];
        if (actionName) this.emitAction(actionName, e);
      });
    }
    if (eventHandlers) {
      this.addEventHandler(function (e) {
        let h = eventHandlers![e.name];
        h && h.call(this, e);
      });
    }

    // return a function that applies remaining properties to new instances
    return function (this: Component) {
      for (let p in presets) {
        let v = (presets as any)[p];
        if (v !== undefined) _applyPropertyValue(this, p, v);
      }
    };
  }

  /**
   * Add given binding to this component constructor, so that the property with given name *on all instances* will be updated with value(s) taken from the bound parent object. Optionally given function is used to set the property value using the updated (bound) value; otherwise, values are copied directly except for arrays, which are used to replace the values in a managed list (see `ManagedList.replace`).
   * @note This method is used by `preset` when the argument to `.with()` includes a binding (see `bind`). This method should not be used directly unless passing a binding to `.with()` is not possible.
   */
  static presetBinding<TComponent extends Component>(
    this: ComponentConstructor<TComponent>,
    propertyName: string,
    binding: Binding,
    applyBoundValue?: (this: TComponent, boundValue: any, oldValue?: any) => any
  ) {
    // add a reference to the binding itself
    if (!this.prototype.hasOwnProperty(HIDDEN.BINDINGS_PROPERTY)) {
      this.prototype[HIDDEN.BINDINGS_PROPERTY] = Object.create(
        this.prototype[HIDDEN.BINDINGS_PROPERTY]
      );
    }
    this.prototype[HIDDEN.BINDINGS_PROPERTY][propertyName] = binding;

    // add an update function
    if (!applyBoundValue) {
      applyBoundValue = function (this: Component, v: any, o: any) {
        _applyPropertyValue(this, propertyName, v, o);
      };
    }
    this.prototype[binding.id] = applyBoundValue;
  }

  /**
   * Inherit bindings from given component constructor(s) on this constructor. Inherited bindings will be bound to the same bound parent object as bindings passed to `.with()` directly, to update bound properties of (nested) child instances.
   * @note This method must be used by a custom `preset` function if the preset component (may) have managed child objects (see `@managedChild`) of the given type and the constructor is not passed to `super.preset(...)` or `presetBoundComponent(...)`. Alternatively, use the `@component` decorator on properties that refer to child components, which also presets bindings from a given component type.
   */
  static presetBindingsFrom(...constructors: Array<ComponentConstructor | undefined>) {
    if (!this.prototype.hasOwnProperty(HIDDEN.BIND_INHERIT_PROPERTY)) {
      let a = this.prototype[HIDDEN.BIND_INHERIT_PROPERTY];
      this.prototype[HIDDEN.BIND_INHERIT_PROPERTY] = a ? a.slice() : [];
    }
    for (const C of constructors) {
      if (C) {
        if (!C.prototype || !(C.prototype instanceof Component)) throw TypeError();
        this.prototype[HIDDEN.BIND_INHERIT_PROPERTY].push(C);
      }
    }
  }

  /**
   * Make this component the _bound_ parent component for given child component type(s). When a component is assigned to given property, making it a child component, its bindings are bound to the current instance (i.e. the bound parent).
   * @returns An object that represents the bound parent-child composition, and contains methods that can be used to fine-tune binding behavior.
   * @note Given property _must_ already be designated as a managed child property (see `@managedChild` decorator). Do **not** use this method on properties that are already decorated using the `@component` decorator.
   */
  static presetBoundComponent(
    propertyName: string,
    ...constructors: Array<ComponentConstructor | undefined>
  ) {
    if (!this.prototype.hasOwnProperty(HIDDEN.COMPOSTN_PROPERTY)) {
      this.prototype[HIDDEN.COMPOSTN_PROPERTY] = {
        ...this.prototype[HIDDEN.COMPOSTN_PROPERTY],
      };
    }
    let composition = new Component.BoundComposition(this, ...constructors);
    this.prototype[HIDDEN.COMPOSTN_PROPERTY][propertyName] = composition;
    return composition;
  }

  /** Create a new component */
  constructor() {
    super();
  }

  /** Returns true if the class that this instance has been created from was itself created using `Component.with` somewhere along the prototype chain. */
  protected isPresetComponent() {
    return false;
  }

  /**
   * Delegate given event by invoking a matching handler method, prefixing the event name with 'on'. For example, events with name 'Submit' can be handled by a method named `onSubmit()`. The handler method is called with the same arguments as this method, and should return `true` if the event has been handled.
   * Additionally, if the event is of type `ActionEvent`, and if a handler method was not found, or if it did not return `true`, then the event is re-emitted on the component itself (also known as 'propagated') -- allowing it to be handled by other components, usually by a parent component.
   * This method is used as a default handler for `@delegateEvents`. It can be overridden if events should be handled differently in specific cases. A return value other than `true` indicates that the event is neither handled by a method that returned `true` itself, nor propagated.
   * @note In case the event name starts with a lowercase letter (a-z), the handler method should still include a capital letter (e.g. `onDoSomething()` for an event named 'doSomething'). However, it is _not_ recommended to use event names that start with lowercase letters.
   */
  protected delegateEvent(e: ManagedEvent, propertyName: string): boolean | void {
    let method = (this as any)[_makeMethodName(e.name)];
    let handled: any = typeof method === "function" && method.call(this, e, propertyName);
    if (handled === true) return true;
    if (handled && handled.then && handled.catch) {
      (handled as Promise<any>).catch(err => exceptionHandler(err));
    }
    if (e instanceof ActionEvent) {
      this.emit(e);
      return true;
    }
  }

  /** Returns the current parent component. If a class reference is specified, finds the nearest parent of given type. See `@managedChild` decorator. */
  getParentComponent<TParent extends Component = Component>(
    ParentClass?: ComponentConstructor<TParent>
  ) {
    return this.getManagedParent(ParentClass || Component) as TParent | undefined;
  }

  /** Returns the parent component that is the source of all bound values on this component. See `@component` decorator, and `presetBoundComponent()`. */
  getBoundParentComponent<TParent extends Component>(
    ParentClass?: ComponentConstructor<TParent>
  ): TParent | undefined {
    let obs = this[HIDDEN.COMPONENT_OBSERVER_PROPERTY];
    if (!ParentClass) return obs && (obs.boundParent as any);
    let cur = obs && obs.boundParent;
    while (cur && !(cur instanceof ParentClass)) {
      cur = cur.getBoundParentComponent();
    }
    return cur as any;
  }

  /**
   * Emit an action event (see `ActionEvent`), to signal the result of a user action that should be handled by a parent component.
   * @note The event is frozen using `ManagedEvent.freeze()` so that its properties cannot be modified even if the event is reused by parent component(s).
   */
  emitAction(name: string, inner?: ManagedEvent, context?: ManagedObject) {
    let event = new ActionEvent(name, this, inner);
    event.context = context;
    this.emit(event.freeze());
  }

  /**
   * @deprecated in v3.1
   * NOTE: This method will be deprecated in favor of calling `emit` directly. Its name is confusing and after streamlining other parts it will serve no further purpose.
   * Create and emit an event with given name, a reference to this component, and an optional inner (propagated) event. The base implementation emits a plain `ComponentEvent`, but this method may be overridden to emit other events.
   * @note If the component is already in the 'destroyed' state (see `ManagedObject.managedState`), then no event is emitted and this method returns immediately.
   * @note This method is used by classes created using `Component.with` if an event handler is specified using the `{ ... onEventName: "OtherEvent" }` pattern.
   */
  propagateComponentEvent(name: string, inner?: ManagedEvent) {
    if (!this.managedState) return;
    this.emit(ComponentEvent, name, this, inner);
  }

  /** @internal Returns a bound binding for given instance, either bound on this component or its composite parent(s) */
  getBoundBinding(binding: Binding) {
    return (
      this[HIDDEN.COMPONENT_OBSERVER_PROPERTY] &&
      this[HIDDEN.COMPONENT_OBSERVER_PROPERTY]!.getCompositeBound(binding)
    );
  }

  /** @internal Bindings that occur on this component (ONLY on prototype, do not set directly) */
  [HIDDEN.BINDINGS_PROPERTY]!: { [propertyName: string]: Binding };

  /** @internal Components for which bindings should be inherited, aka 'included' component bindings (ONLY on prototype, do not set directly) */
  [HIDDEN.BIND_INHERIT_PROPERTY]!: ComponentConstructor[];

  /** @internal Bound properties and their associated observers (ONLY on prototype, do not set directly) */
  [HIDDEN.COMPOSTN_PROPERTY]!: { [propertyName: string]: Component.BoundComposition };

  /** @internal ComponentObserver for this instance, includes list of currently bound bindings (hidden property) */
  [HIDDEN.COMPONENT_OBSERVER_PROPERTY]: Component.ComponentObserver;
}

// set default values for hidden properties
Component.prototype[HIDDEN.BINDINGS_PROPERTY] = Object.create(null);
Component.prototype[HIDDEN.BIND_INHERIT_PROPERTY] = [];
Component.prototype[HIDDEN.COMPOSTN_PROPERTY] = Object.create(null);

export namespace Component {
  /** Represents the relationship between a parent component class and a bound component class, to keep track of all bindings that are found on the bound component and its child components */
  export class BoundComposition {
    constructor(
      public readonly Composite: typeof Component,
      ...include: Array<ComponentConstructor | undefined>
    ) {
      this._bindings = this._getAllBindings(...include);
      observe(Composite, () => this._createObserver());
    }

    /** Returns a list of all bindings that should be bound to the composite parent */
    getBindings() {
      return this._bindings.slice();
    }

    /** Remove all bindings that are to be bound to properties that are *not* included in the list of parameters; this causes any of those bindings on instances of the active component and its child component to be bound to the *parent composite* component instead */
    limitBindings(...propertyNames: string[]) {
      let bindings: Binding[] = [];
      if (!this._unbound) this._unbound = [];
      for (let b of this._bindings) {
        let included =
          propertyNames.some(p => b.propertyName === p) ||
          (b.bindings &&
            b.bindings.some(bb => propertyNames.some(p => bb.propertyName === p)));
        if (included) bindings.push(b);
        else this._unbound.push(b);
      }
      this._bindings = bindings;
    }

    /** @internal create an observer class specifically for this composition */
    private _createObserver() {
      // get a list of all properties that should be observed
      let propertiesToObserve = this._bindings
        .filter(b => b.propertyName !== undefined)
        .map(b => b.propertyName!);

      // add an observer to the composite parent class
      // to be able to capture property changes
      if (propertiesToObserve.length) {
        class PropertyChangeObserver {
          constructor(public readonly c: Component) {}
          @onPropertyChange(...propertiesToObserve)
          updatePropertyAsync(v: any, _e: any, name: string) {
            let o = this.c[HIDDEN.COMPONENT_OBSERVER_PROPERTY];
            o && o.updateCompositeBound(name, v);
          }
        }
        return PropertyChangeObserver;
      }
    }

    /** Returns a list of all bindings on the active component, its children and inherited components */
    private _getAllBindings(...include: Array<ComponentConstructor | undefined>) {
      // find all (nested) component bindings recursively
      let bindings: Binding[] = [];
      let addBinding = (binding: Binding) => {
        bindings.push(binding);
        if (binding.bindings) {
          binding.bindings.forEach(b => addBinding(b));
        }
      };
      let addBindings = (C?: ComponentConstructor) => {
        // add own bindings
        if (!C) return;
        let b = (C.prototype as Component)[HIDDEN.BINDINGS_PROPERTY];
        for (let p in b) addBinding(b[p]);

        // add inherited bindings
        let i = (C.prototype as Component)[HIDDEN.BIND_INHERIT_PROPERTY];
        for (let c of i) addBindings(c);

        // add unbound composite bindings
        let c = (C.prototype as Component)[HIDDEN.COMPOSTN_PROPERTY];
        for (let p in c) {
          let u = c[p]._unbound;
          if (u) {
            for (let q in u) addBinding(u[q]);
          }
        }
      };
      include.forEach(addBindings);
      return bindings;
    }

    private _bindings: Binding[];
    private _unbound?: Binding[];
  }

  /** @internal Component observer: maintains directed graph of bound parent and child components, and lists of bound bindings so that property changes on the bound parent will actually trigger binding updates for all child components */
  export class ComponentObserver {
    constructor(public readonly component: Component) {
      // set backreference on the component itself
      Object.defineProperty(component, HIDDEN.COMPONENT_OBSERVER_PROPERTY, {
        enumerable: false,
        writable: false,
        value: this,
      });
    }

    /** Current bound parent component, if any */
    boundParent?: Component;

    /** Returns the bound instance of given binding */
    getCompositeBound(binding: Binding): Binding.Bound | undefined {
      return (
        (this._compositeBound && this._compositeBound.get(binding.id)) ||
        (this.boundParent &&
          this.boundParent[HIDDEN.COMPONENT_OBSERVER_PROPERTY] &&
          this.boundParent[HIDDEN.COMPONENT_OBSERVER_PROPERTY].getCompositeBound(binding))
      );
    }

    /** Respond to parent-change events on the component itself */
    onEvent(e: ManagedEvent) {
      if (e === ManagedCoreEvent.DESTROYED) {
        // unbind from current parent, if any
        if (this._parentObserver) {
          this._parentObserver._removeChildObserver(this);
          this._unbind();
          this.boundParent = undefined;
        }
      } else if (e instanceof ManagedParentChangeEvent) {
        // get the new component parent, if any
        let parentComponent = this.component.getParentComponent();
        let parentObserver =
          parentComponent && parentComponent[HIDDEN.COMPONENT_OBSERVER_PROPERTY];
        if (parentObserver === this._parentObserver) return;

        // unbind from current parent first, if any
        if (this._parentObserver) {
          this._parentObserver._removeChildObserver(this);
          this._unbind();
          this.boundParent = undefined;
        }

        // register with new parent observer and (re)bind if possible
        this._parentObserver = parentObserver;
        if (parentObserver) {
          parentObserver._addChildObserver(this);

          // check if the new parent is also the new bound parent itself,
          // otherwise copy bound parent from parent component observer
          if (
            e.parent === parentComponent &&
            e.propertyName &&
            parentComponent[HIDDEN.COMPOSTN_PROPERTY][e.propertyName]
          ) {
            let composition = parentComponent[HIDDEN.COMPOSTN_PROPERTY][e.propertyName];
            this.boundParent = parentComponent;
            parentObserver._addCompositeBound(composition.getBindings());
          } else {
            this.boundParent = parentObserver.boundParent;
          }
          this._bind();
        }

        // update all child observers about this change too
        for (let id in this._childObservers) {
          this._childObservers[id]._updateParent(this, true);
        }
      }
    }

    /** Update values for all bound bindings with given property name (or all) */
    updateCompositeBound(propertyName?: string, v?: any) {
      if (!this._compositeBound) return;
      if (!propertyName) {
        this._compositeBound.forEach((_id, bound) => {
          bound.updateComponents();
        });
      } else if (arguments.length < 2) {
        this._compositeBound.forEach((_id, bound) => {
          if (bound.propertyName === propertyName) {
            bound.updateComponents();
          }
        });
      } else {
        this._compositeBound.forEach((_id, bound) => {
          if (bound.propertyName === propertyName) {
            bound.updateComponents(v);
          }
        });
      }
      return this;
    }

    /** Register child component observer */
    _addChildObserver(childObserver: ComponentObserver) {
      let id = childObserver.component.managedId;
      if (!this._childObservers[id]) {
        this._childObservers[id] = childObserver;
        this._nChildren = (this._nChildren || 0) + 1;
      }
    }

    /** Remove child component observer */
    _removeChildObserver(childObserver: ComponentObserver) {
      let id = childObserver.component.managedId;
      if (this._childObservers[id]) {
        delete this._childObservers[id];
        if (!--this._nChildren && this._compositeBound) {
          // last child observer is gone, clear all bound
          this._compositeBound.clear();
        }
      }
    }

    /** Update bound parent reference according to (new, or existing but updated) parent component reference */
    _updateParent(parentObserver: ComponentObserver, isParent: boolean) {
      // check if parent is already the bound parent
      if (isParent && parentObserver.component === this.boundParent) isParent = false;

      // unbind if needed, and bind again
      if (isParent) {
        this._unbind();
        this.boundParent = parentObserver.boundParent;
      }
      this._bind();

      // recurse to further child components
      for (let id in this._childObservers) {
        this._childObservers[id]._updateParent(this, isParent);
      }
    }

    /** Unbind from current bound parent, if any */
    _unbind() {
      if (!this._ownBound) return;
      for (let p in this._ownBound) {
        this._ownBound[p].remove(this.component);
      }
      this._ownBound = undefined;
    }

    /** Update bindings to refer to the current bound parent, if any */
    _bind() {
      if (!this.boundParent) return;
      let component = this.component;
      let boundObserver = this.boundParent[HIDDEN.COMPONENT_OBSERVER_PROPERTY];
      let bindings = component[HIDDEN.BINDINGS_PROPERTY];

      // bind all bindings on own component
      let o = this._ownBound || (this._ownBound = Object.create(null));
      for (let p in bindings) {
        if (!o[p]) {
          let binding = bindings[p];
          let bound = boundObserver.getCompositeBound(binding);
          if (bound && !bound.includes(component)) o[p] = bound.add(component);
        }
      }

      // update values now
      for (let p in o) {
        let bound = o[p] as Binding.Bound;
        try {
          (component as any)[bound.binding.id]?.(bound.value);
        } catch (err) {
          exceptionHandler(err);
        }
      }
    }

    /** Add given bindings as composite bindings on the component itself, if they are not bound yet, i.e. create bound instances so that they can be used in child components */
    _addCompositeBound(bindings: Binding[]) {
      if (!this._compositeBound) this._compositeBound = new ManagedMap();
      for (let b of bindings) {
        if (!this._compositeBound.has(b.id)) {
          this._compositeBound.set(b.id, new Binding.Bound(b, this.component));
        }
      }
    }

    /** Current parent component observer, if any; this one references this observer through its `childObservers` property */
    private _parentObserver?: ComponentObserver;

    /** List of child component observers, indexed by component ID; maintained by child observers themselves */
    private _childObservers: { [managedId: string]: ComponentObserver } =
      Object.create(null);

    /** Number of currently registered child observers (in _childObservers) */
    private _nChildren = 0;

    /** Bound bindings for this component ONLY (i.e. those that need to update binding values on this component); these are taken from the bound parent component observer when set, so that they can be unbound when needed */
    private _ownBound?: { [propertyName: string]: Binding.Bound };

    /** Map of bound bindings for ALL bound child components (if any), i.e. those that take their values from this component and update values on child components */
    private _compositeBound?: ManagedMap<Binding.Bound>;
  }
  Component.addObserver(ComponentObserver);
}

/** Helper function to make an event handler from a preset string property -- DEPRECATED use only */
function _makeEventHandler(name: string) {
  if (name.slice(-2) === "()") {
    // Invoking event handlers on bound parent components by name
    // was a bad idea and will not be supported anymore.
    let callMethodName = name.slice(0, -2);
    return function (this: Component, e: ManagedEvent) {
      let composite: Component | undefined = this.getBoundParentComponent();
      while (composite) {
        let f = composite && (composite as any)[callMethodName];
        if (typeof f === "function") return f.call(composite, e);
        composite = composite.getBoundParentComponent();
      }
      throw err(ERROR.Component_NotAHandler, callMethodName);
    };
  }
  throw err(ERROR.Component_InvalidEventHandler, name);
}

/** Simple ManagedObject class that encapsulates a single value, used below */
class ManagedValueObject<T> extends ManagedObject {
  constructor(public value: T) {
    super();
  }
  valueOf() {
    return this.value;
  }
}

/**
 * Property decorator: amend decorated property to turn it into a managed child _component_ reference of given type. Also presets bindings from given component type on the parent component (see `Component.presetBoundComponent()`, which allows for greater control of the resulting bindings).
 *
 * This asserts a parent-child 'composition' dependency between the referrer and the referenced object(s):
 * - This property can only be assigned a reference to a `Component` instance of given type.
 * - When the parent is destroyed, all children are also destroyed.
 * - When the decorated property is set to another object, the previously referenced object is destroyed.
 * - When the referenced object is assigned to another managed child reference (or list, map, or reference instance that is a child object), the decorated property is set to undefined.
 * - The child object may refer to its parent using the `Component.getParentComponent()` and `Component.getBoundParentComponent()` methods.
 *
 * @note: The component type parameter is optional, this decorator can be used both on its own or with a class parameter.
 *
 * @decorator
 */
export function component<T extends Component>(
  componentType?: ComponentConstructor
): PropertyDecorator;
export function component<T extends Component>(target: T, propertyKey: any): void;
export function component<T extends Component>(
  componentTypeOrTarget?: any,
  propertyKey?: any
) {
  let C: any = undefined;
  function decorator(target: T, propertyKey: any) {
    if (!(target.constructor.prototype instanceof Component)) throw TypeError();
    ManagedObject.createManagedReferenceProperty(
      target,
      propertyKey,
      true,
      undefined,
      C || Component
    );
    (target.constructor as typeof Component).presetBoundComponent(propertyKey, C);
  }
  if (propertyKey) {
    // this is used without a parameter, decorate given property immediately
    decorator(componentTypeOrTarget, propertyKey);
  } else {
    // this is used with a parameter, return decorator function now
    if (componentTypeOrTarget) C = componentTypeOrTarget;
    return decorator;
  }
  return;
}

/**
 * Property decorator: observe events on objects that are referenced by this property. For each event, the `delegateEvent()` method is invoked on the containing component. A default implementation is provided as `Component.delegateEvent`, but this method can be overridden by each subclass.
 * @note This decorator _must_ be combined with `@managed`, `@managedChild`, `@component`, or `@service`
 * @decorator
 */
export function delegateEvents(targetPrototype: Component, propertyKey: string) {
  defineChainableProperty(
    targetPrototype,
    propertyKey as string,
    false,
    (obj: any, _name, next) => {
      let handling: ManagedEvent | undefined;
      return (value, event, topHandler) => {
        next && next(value, event, topHandler);
        if (event) {
          // received an event from the referenced object, delegate synchronously
          if (handling === event || !obj[HIDDEN.STATE_PROPERTY]) return;
          try {
            obj.delegateEvent((handling = event), propertyKey);
            handling = undefined;
          } catch (err) {
            exceptionHandler(err);
          }
        }
      };
    }
  );
}

/** Helper function to update a component property with given value, with some additional logic for managed lists */
function _applyPropertyValue(c: Component, p: string, value: any, old?: any) {
  let cur = (c as any)[p];
  if (cur && cur instanceof ManagedList) {
    if (Array.isArray(value)) {
      // update managed lists with array items
      cur.replace(
        value.map(it => (it instanceof ManagedObject ? it : new ManagedValueObject(it)))
      );
      return;
    }
    if (value === undefined && old !== cur) {
      // clear array with undefined value
      cur.clear();
      return;
    }
  }
  // otherwise set property value normally
  (c as any)[p] = value;
}

/** Helper function to compose a handler method name from an event name, possibly capitalizing its first letter */
function _makeMethodName(name: string) {
  return (
    "on" +
    (name[0] < "a" || name[0] > "z"
      ? name
      : String.fromCharCode(name.charCodeAt(0) - (97 /* a */ - 65) /* A */) + name.slice(1))
  );
}
