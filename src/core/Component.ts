import { err, ERROR } from "../errors";
import { Binding } from "./Binding";
import {
  ManagedChangeEvent,
  ManagedCoreEvent,
  ManagedEvent,
  ManagedParentChangeEvent,
} from "./ManagedEvent";
import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject, ManagedState } from "./ManagedObject";
import { managedChild } from "./ManagedReference";
import { onPropertyChange } from "./observe";

/** Arbitrary name of a hidden property for bindings on the Component prototype */
const HIDDEN_BINDINGS_PROPERTY = "^preBnd";

/** Arbitrary name of a hidden property for bound-inherit components on the Component prototype */
const HIDDEN_BIND_INHERIT_PROPERTY = "^preInc";

/** Arbitrary name of a hidden property for components on the Component prototype */
const HIDDEN_COMPOSE_PROPERTY = "^preCmp";

/** Arbitrary name of a hidden property that references the base Component observer */
const HIDDEN_OBSERVER_PROPERTY = "^cmpObs";

/** Event that is reused to be emitted on Components that are already instantiated but a new active component is preset */
const RECOMPOSE_EVENT = new ManagedCoreEvent("Recompose").freeze();

/** Event that is emitted on a particular `Component` instance, with reference to the source component as `source` */
export class ComponentEvent<TComponent extends Component = Component> extends ManagedEvent {
  constructor(name: string, source: TComponent, inner?: ManagedEvent) {
    super(name);
    this.source = source;
    this.inner = inner;
  }

  /** Source component */
  source: TComponent;

  /** Encapsulated event (i.e. propagated event if this event was emitted by `Component.propagateComponentEvent`) */
  inner?: ManagedEvent;
}

/** Event handler type, can be used to define the type of a preset event handler as a string or function */
export type ComponentEventHandler<TComponent = Component, TEvent = ComponentEvent> =
  | string
  | ((this: TComponent, e: TEvent) => void);

/**
 * Generic constructor type for Component, matching both parameterless constructors and those with one or more required parameters.
 * For a constructable type, combine with a specific function type, e.g. `ComponentConstructor & (new () => MyComponent)`.
 */
export type ComponentConstructor<TComponent extends Component = Component> = new (
  ...args: any[]
) => TComponent;

/** Inferred partial type of the argument to `Component.with` without bindings, for a specific component constructor */
export type ComponentPresetType<
  TComponentCtor extends ComponentConstructor
> = TComponentCtor extends { preset: (presets: infer TPreset) => void } ? TPreset : any;

/** Inferred type of the argument to `Component.with` for a specific component constructor */
export type ComponentPresetArgType<TComponentCtor extends ComponentConstructor> = {
  [P in keyof ComponentPresetType<TComponentCtor>]?:
    | ComponentPresetType<TComponentCtor>[P]
    | Binding.Type;
} & {
  [P: string]: any;
};

/** Inferred type of the rest arguments to `Component.with` for a specific component constructor */
export type ComponentPresetRestType<
  TComponentCtor extends ComponentConstructor
> = TComponentCtor extends {
  preset: (presets: ComponentPresetType<TComponentCtor>, ...rest: infer TRest) => void;
}
  ? TRest
  : never;

export type ComponentCtorWithPreset<
  TComponentCtor extends ComponentConstructor
> = TComponentCtor & { preset(presets: ComponentPresetType<TComponentCtor>): Function };

/** @internal Event that is emitted on (parent) components when a child component is added. The parent component observer responds by setting the `parentObserver` property on the child observer. */
export class ComponentChildAddedEvent extends ManagedEvent {
  constructor(observer: Component.ComponentObserver) {
    super("ChildComponentAdded");
    this.source = observer.component;
    this.observer = observer;
  }

  /** Source component */
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

  /** Source component */
  source: Component;

  /** The composite parent object reference */
  composite?: Component;
}

/**
 * Component base class. Represents a managed object (see `ManagedObject`) that can be initialized from a 'preset' structure passed to its static `with` method.
 * Component property values may be bound (see `bind`) to properties of a 'composite' parent, i.e. the component that references sub components through a property decorated with the `@compose` decorator.
 */
export class Component extends ManagedObject {
  /**
   * Create a new component _constructor_, for which instances are automatically updated with given properties, bindings, event handlers, and other values.
   * - When an instance is activated, components included as preset properties are instantiated and assigned to properties with the same name as the preset object property.
   * - When an instance becomes a (nested) child component of an active _composite object_ (or upon activation of such an object), bindings are activated to reflect values from the composite object.
   * - Event handlers are added on all instances of the component class, using one of the following patterns:
   *   * `{ ... onEventName: "methodName()" }` to invoke given method directly on the first composite object that defines a method with this name, whenever an event with given name is emitted, passing the event as the first and only argument, or
   *   * `{ ... onEventName: "+OtherEvent" }` to emit another event with given name. The event is created and emitted using the `Component.propagateComponentEvent` method.
   * - Upon initialization of each instance, the `update` method is called with the remaining properties in the intializer argument, and all rest arguments (component classes) of the same type as the arguments to this method.
   */
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentCtorWithPreset<TComponentCtor>,
    ...rest: ComponentPresetRestType<TComponentCtor>
  ): TComponentCtor;
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentCtorWithPreset<TComponentCtor>,
    presets: new () => any,
    ...rest: ComponentPresetRestType<TComponentCtor>
  ): "INVALID_PRESET_ARGUMENT";
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentCtorWithPreset<TComponentCtor>,
    presets: ComponentPresetArgType<TComponentCtor>,
    ...rest: ComponentPresetRestType<TComponentCtor>
  ): TComponentCtor;
  static with<TComponentCtor extends ComponentConstructor>(
    this: ComponentCtorWithPreset<TComponentCtor>,
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
    if (typeof obj !== "object" || Object.getPrototypeOf(obj) !== Object.prototype) {
      presetFunc = PresetComponent.preset({}, ...presets);
    } else {
      presetFunc = PresetComponent.preset(...(presets as [{}]));
    }

    // return the extended class
    return PresetComponent as any;
  }

  /**
   * Add bindings, components, and event handlers from given presets to the current component constructor. This method is called by `Component.with` with the same arguments.
   * Component classes _may_ override this method and return the result of `super.preset(...)` if:
   * - the `.with()` function for a component class should accept custom type(s) for its arguments. The parameter signature for the `preset` method is used to determine the parameter signature for `.with()` on a component class.
   * - component instances should be prepared in any way other than setting property values, adding bindings, or event handlers immediately after being constructed (using the returned callback).
   * @returns A function (*must* be typed as `Function` even in derived classes) that is called by the constructor for each new instance, to apply remaining values from the preset object to the component object that is passed through `this`.
   */
  static preset(presets: object, ...rest: unknown[]): Function {
    // take and apply bindings and components to the constructor already
    let eventHandlers:
      | { [eventName: string]: (this: Component, e: any) => void }
      | undefined;
    for (let p in presets) {
      let v = (presets as any)[p];
      if (Binding.isBinding(v)) {
        // add binding to constructor and remove from presets
        this.presetBinding(p, v);
        delete (presets as any)[p];
      } else if (
        v &&
        p[0] === "o" &&
        p[1] === "n" &&
        (p.charCodeAt(2) < 97 || p.charCodeAt(2) > 122)
      ) {
        // add event handlers to object
        if (!eventHandlers) eventHandlers = {};
        eventHandlers[p.slice(2)] =
          typeof v === "function" ? v : _makeEventHandler(String(v));
        delete (presets as any)[p];
      } else if (typeof v === "function" && v.prototype instanceof Component) {
        // add bindings for component constructor
        rest.push(v);
      }
    }
    // register bindings for child components, if any
    if (rest.length) this.presetBindingsFrom(...(rest as any));

    // add event handlers, if any
    if (eventHandlers) {
      this.handle(eventHandlers);
    }

    // return a function that applies remaining properties to new instances
    return function(this: Component) {
      for (let p in presets) {
        let v = (presets as any)[p];
        if (v !== undefined) _applyPropertyValue(this, p, v);
      }
    };
  }

  /**
   * Add given binding to this component constructor, so that the property with given name *on all instances* will be updated with value(s) taken from the parent composite object. Optionally given function is used to set the property value using the updated (bound) value; otherwise, values are copied directly except for arrays, which are used to replace the values in a managed list (see `ManagedList.replace`).
   * @note This method is used by `preset` when the argument to `.with()` includes a binding (see `bind`). This method should not be used directly unless passing a binding to `.with()` is not possible.
   */
  static presetBinding<TComponent extends Component>(
    this: ComponentConstructor<TComponent>,
    propertyName: string,
    binding: Binding,
    applyBoundValue?: (this: TComponent, boundValue: any) => any
  ) {
    // add a reference to the binding itself
    if (!this.prototype.hasOwnProperty(HIDDEN_BINDINGS_PROPERTY)) {
      this.prototype[HIDDEN_BINDINGS_PROPERTY] = {
        ...this.prototype[HIDDEN_BINDINGS_PROPERTY],
      };
    }
    this.prototype[HIDDEN_BINDINGS_PROPERTY][propertyName] = binding;

    // add an update function
    if (!applyBoundValue) {
      applyBoundValue = function(this: Component, v: any) {
        _applyPropertyValue(this, propertyName, v);
      };
    }
    this.prototype[binding.id] = applyBoundValue;
  }

  /**
   * Inherit bindings from given component constructor(s) on this constructor. Inherited bindings will be bound to the same parent composite object as bindings passed to `.with()` directly, to update bound properties of (nested) child instances.
   * @note This method must be used by a custom `preset` function if the preset component (may) have managed child objects (see `@managedChild`) of the given type and the constructor is not passed to `super.preset(...)`.
   */
  static presetBindingsFrom(...constructors: Array<ComponentConstructor | undefined>) {
    if (!this.prototype.hasOwnProperty(HIDDEN_BIND_INHERIT_PROPERTY)) {
      this.prototype[HIDDEN_BIND_INHERIT_PROPERTY] = this.prototype[
        HIDDEN_BIND_INHERIT_PROPERTY
      ]
        ? this.prototype[HIDDEN_BIND_INHERIT_PROPERTY].slice()
        : [];
    }
    for (const C of constructors) {
      if (C) this.prototype[HIDDEN_BIND_INHERIT_PROPERTY].push(C);
    }
  }

  /**
   * Add a sub component to this component; see `compose`.
   * Given property must *already* be decorated with the `@managedChild` decorator. This method is intended for use by `Component.preset`.
   */
  static presetActiveComponent(
    propertyName: string,
    constructor: ComponentConstructor & (new () => Component),
    ...include: ComponentConstructor[]
  ) {
    if (!this.prototype.hasOwnProperty(HIDDEN_COMPOSE_PROPERTY)) {
      this.prototype[HIDDEN_COMPOSE_PROPERTY] = {
        ...this.prototype[HIDDEN_COMPOSE_PROPERTY],
      };
    }
    let h = this.prototype[HIDDEN_COMPOSE_PROPERTY];
    let exists = false;
    if (h[propertyName]) {
      // component already preset, check if same constructor
      if (h[propertyName].ActiveComponent === constructor) {
        return h[propertyName];
      }
      exists = true;
    }

    // add new component with observer and enable immediately
    let result = (h[propertyName] = new Component.Composition(
      this,
      propertyName,
      constructor,
      ...include
    ));
    if (exists) result.forceRecomposeAll();
    return result;
  }

  /** Create a new component */
  constructor() {
    super();
  }

  /** Returns true if the class that this instance has been created from was itself created using `Component.with` somewhere along the prototype chain. */
  protected isPresetComponent() {
    return false;
  }

  /** Returns the current parent component. See `@managedChild` decorator. */
  getParentComponent(): Component | undefined;
  /** Returns the current parent component. See `@managedChild` decorator. */
  getParentComponent<TParent extends Component>(
    ParentClass: ComponentConstructor<TParent>
  ): TParent | undefined;
  getParentComponent(ParentClass: any = Component) {
    return this.getManagedParent(ParentClass);
  }

  /**
   * Returns the parent component that contains the `@compose` property which references this component (or the parent's parent if this component's parent is referenced by a `@compose` property instead, and so on).
   * If there is no component that (indirectly) references this component through a `@compose` property, this method returns undefined.
   */
  getCompositeParent<TParent extends Component>(
    ParentClass?: ComponentConstructor<TParent>
  ): TParent | undefined {
    let obs = this[HIDDEN_OBSERVER_PROPERTY];
    if (!ParentClass) return obs && (obs.compositeParent as any);
    let cur = obs && obs.compositeParent;
    while (cur && !(cur instanceof ParentClass)) {
      cur = cur.getCompositeParent();
    }
    return cur as any;
  }

  /**
   * Create and emit an event with given name, a reference to this component, and an optional inner (propagated) event. The base implementation emits a plain `ComponentEvent`, but this method may be overridden to emit other events.
   * @note This method is used by classes created using `Component.with` if an event handler is specified using the `{ ... onEventName: "+OtherEvent" }` pattern.
   */
  propagateComponentEvent(name: string, inner?: ManagedEvent) {
    this.emit(ComponentEvent, name, this, inner);
  }

  /** @internal Returns a bound binding for given instance, either bound on this component or its composite parent(s) */
  getBoundBinding(binding: Binding) {
    return (
      this[HIDDEN_OBSERVER_PROPERTY] &&
      this[HIDDEN_OBSERVER_PROPERTY]!.getCompositeBound(binding)
    );
  }

  /** @internal Bindings that occur on this component (ONLY on prototype, do not set directly) */
  [HIDDEN_BINDINGS_PROPERTY]!: { [propertyName: string]: Binding };

  /** @internal Component for which bindings should be inherited (ONLY on prototype, do not set directly) */
  [HIDDEN_BIND_INHERIT_PROPERTY]!: ComponentConstructor[];

  /** @internal Active components of this component (ONLY on prototype, do not set directly) */
  [HIDDEN_COMPOSE_PROPERTY]!: { [propertyName: string]: Component.Composition };

  /** @internal Base component observer, if the component has a composite parent or has been actived (hidden property) */
  [HIDDEN_OBSERVER_PROPERTY]: Component.ComponentObserver;
}

// set default values for hidden properties
Component.prototype[HIDDEN_BINDINGS_PROPERTY] = {};
Component.prototype[HIDDEN_BIND_INHERIT_PROPERTY] = [];
Component.prototype[HIDDEN_COMPOSE_PROPERTY] = {};

export namespace Component {
  /** Represents the relationship between a composite parent component class and the active component class */
  export class Composition {
    constructor(
      public readonly Composite: typeof Component,
      public readonly propertyName: string,
      public readonly ActiveComponent: ComponentConstructor & (new () => Component),
      ...include: ComponentConstructor[]
    ) {
      this._bindings = this._getAllBindings(...include);

      // get a list of all properties that should be observed
      let propertiesToObserve = this._bindings
        .filter(b => b.propertyName !== undefined)
        .map(b => b.propertyName!);

      // add an observer to the composite parent class
      // to be able to capture property changes ONLY
      if (propertiesToObserve.length) {
        class PropertyChangeObserver {
          constructor(public readonly c: Component) {}
          @onPropertyChange(...propertiesToObserve)
          updatePropertyAsync(v: any, _e: any, name: string) {
            let o = this.c[HIDDEN_OBSERVER_PROPERTY];
            o && o.updateCompositeBound(name, v);
          }
        }
        Composite.observe(PropertyChangeObserver);
      }
    }

    /** @internal Force recomposition for all instances of the parent Component; called automatically if this composition replaces an existing one for the same property. This method is mostly used to support Hot Module Reload where a new view is preset onto existing components. */
    forceRecomposeAll() {
      let doRecompose = true;
      let self = this;

      // add an observer that can be woken up with any Change event,
      // to check if the component still contains an old component
      class RecompositionObserver {
        constructor(public readonly c: Component) {}
        onChange() {}
        onActive() {
          // check (once) if need to recompose:
          if (doRecompose) {
            doRecompose = false;
            if (!((this.c as any)[self.propertyName] instanceof self.ActiveComponent)) {
              // trigger a recompose using this event
              // (picked up by ComponentObserver below)
              this.c.emit(RECOMPOSE_EVENT);
            }
          }
        }
      }
      this.Composite.observe(RecompositionObserver);
    }

    /** Returns a list of all bindings that should be bound to the composite parent */
    getBindings() {
      return this._bindings.slice();
    }

    /** Remove all bindings that are to be bound to properties that are *not* included in the list of parameters; this causes any of those bindings on instances of the active component and its child component to be bound to the *parent composite* component instead */
    limitBindings(...propertyNames: string[]) {
      this._bindings = this._bindings.filter(
        b =>
          propertyNames.some(p => b.propertyName === p) ||
          (b.bindings &&
            b.bindings.some(bb => propertyNames.some(p => bb.propertyName === p)))
      );
    }

    /** Returns a list of all bindings on the active component, its children and inherited components */
    private _getAllBindings(...include: ComponentConstructor[]) {
      // find all (nested) component bindings recursively
      let bindings: Binding[] = [];
      let addBindings = (C: ComponentConstructor, q: string) => {
        let b = (C.prototype as Component)[HIDDEN_BINDINGS_PROPERTY];
        for (let p in b) {
          bindings.push(b[p]);
          if (b[p].bindings) bindings.push(...b[p].bindings!);
        }
        let i = (C.prototype as Component)[HIDDEN_BIND_INHERIT_PROPERTY];
        for (let p in i) {
          addBindings(i[p], q + ":" + p);
        }
      };
      addBindings(this.ActiveComponent, this.propertyName);
      include.forEach(C => addBindings(C, "?"));
      return bindings;
    }

    private _bindings: Binding[];
  }

  /** @internal Base component observer, which observes parent references for all components */
  export class ComponentObserver extends ManagedObject {
    constructor(component: Component) {
      super();
      this.component = component;

      // set backreference on the component itself
      Object.defineProperty(component, HIDDEN_OBSERVER_PROPERTY, {
        enumerable: false,
        writable: false,
        value: this,
      });

      // propagate composition events from the parent observer
      ManagedObject.createManagedReferenceProperty(
        this,
        "parentObserver",
        false,
        false,
        undefined,
        event => {
          if (this.parentObserver && event instanceof CompositeParentChangeEvent) {
            // propagate only if this is not already the composite parent
            if (this.parentObserver.component !== this.compositeParent) {
              this.emit(event);
            }
          }
        }
      );
    }

    /** The observed component itself */
    readonly component: Component;

    /** The parent component observer, if any */
    parentObserver?: ComponentObserver;

    /** Current composite parent, if any */
    compositeParent?: Component;

    /** Observer for the current composite parent, if any */
    compositePObs?: ComponentObserver;

    /** List of bound (own) bindings */
    bound?: Binding.Bound[];

    /** Map of bound composite bindings for all child components, indexed by binding ID, if the component is currently active */
    compositeBindings?: ManagedMap<Binding.Bound>;

    /** Respond to events on the component itself */
    onEvent(e: ManagedEvent) {
      if (e === ManagedCoreEvent.INACTIVE) {
        this._destroyComponents();
      } else if (e === ManagedCoreEvent.ACTIVE) {
        this._createComponents();
      } else if (e === RECOMPOSE_EVENT) {
        this._createComponents(true);
      } else if (e instanceof ManagedChangeEvent) {
        this.updateCompositeBound();
      } else if (e instanceof ComponentChildAddedEvent) {
        // Respond to new child components by setting the managed back reference,
        // so that the CompositeParentChange event can be propagated
        if (e.observer) e.observer.parentObserver = this;
      } else if (e instanceof CompositeParentChangeEvent) {
        // Emit this event on this observer to propagate it to child observers
        this.emit(e);
      } else if (e instanceof ManagedParentChangeEvent) {
        // Respond to parent component changes to find the parent observer
        let parentComponent = this.component.getParentComponent();
        if (parentComponent) {
          // let the parent observer attach itself to this observer (sync)
          parentComponent.emit(ComponentChildAddedEvent, this);

          // copy the composite parent reference from the new parent
          let c = this.parentObserver && this.parentObserver.compositeParent;
          if (this.compositeParent !== parentComponent && this.compositeParent !== c) {
            this.component.emit(CompositeParentChangeEvent, this.component, c);
          }
        } else {
          this.parentObserver = undefined;
          this.compositeParent = undefined;
          this.compositePObs = undefined;
        }
      }
    }

    /** Change the composite parent reference for the component, and update bindings */
    setCompositeParent(composite?: Component) {
      if (this.component === composite) return;
      this.compositeParent = composite;
      this.compositePObs = composite && composite[HIDDEN_OBSERVER_PROPERTY];
      this.bindOwn();
    }

    /** (Re-)bind all (own) bindings to the current composite parent */
    bindOwn() {
      // reset and remove current bindings
      this.bound && this.bound.forEach(b => b.remove(this.component));
      if (!this.compositeParent) {
        this.bound = undefined;
        return;
      }
      if (!this.bound) this.bound = [];
      else this.bound.length = 0;

      // go through all bindings and register with their bound instance
      let ownBindings = this.component[HIDDEN_BINDINGS_PROPERTY];
      for (let p in ownBindings) {
        let binding = ownBindings[p];
        let bound = this.compositePObs && this.compositePObs.getCompositeBound(binding);
        if (!bound) {
          if (binding.ignoreUnbound) continue;
          throw err(ERROR.Binding_NotFound, p);
        }
        if (bound.includes(this.component)) continue;
        this.bound.push(bound);
        bound.add(this.component);

        // update bound value now
        if (typeof (this.component as any)[binding.id] === "function") {
          (this.component as any)[binding.id](bound.value);
        }
      }
    }

    /** Return the bound instance for given binding, either from the current component or its composite parent */
    getCompositeBound(binding: Binding): Binding.Bound | undefined {
      return (
        (this.compositeBindings && this.compositeBindings.get(binding.id)) ||
        (this.compositePObs && this.compositePObs.getCompositeBound(binding))
      );
    }

    /** Add a composite bound instance for given binding */
    addCompositeBound(binding: Binding) {
      if (this.compositeBindings && !this.compositeBindings.has(binding.id)) {
        let bound = new Binding.Bound(binding, this.component);
        this.compositeBindings.set(binding.id, bound);
      }
    }

    /** Update values for all bound bindings with given property name (or all), if the component is currently active */
    updateCompositeBound(propertyName?: string, v?: any) {
      if (this.component.managedState !== ManagedState.ACTIVE || !this.compositeBindings) {
        return;
      }

      // find bindings for given property name and update all bound components
      for (let bound of this.compositeBindings.objects()) {
        if (propertyName === undefined || bound.propertyName === propertyName) {
          arguments.length > 1 ? bound.updateComponents(v) : bound.updateComponents();
        }
      }
      return this;
    }

    /** Create all active components (called when component is actived); pass `force` parameter to recreate components where needed */
    private _createComponents(force?: boolean) {
      if (
        this.component.managedState !== ManagedState.ACTIVE ||
        (!force && this.compositeBindings)
      ) {
        return;
      }

      for (let p in this.component[HIDDEN_COMPOSE_PROPERTY]) {
        // add all bindings from component and child components
        if (!this.compositeBindings) {
          this.compositeBindings = new ManagedMap();
        }
        let composition = this.component[HIDDEN_COMPOSE_PROPERTY][p];
        composition.getBindings().forEach(b => this.addCompositeBound(b));

        // create component itself and assign to property
        let existing = (this.component as any)[composition.propertyName];
        if (existing && existing instanceof composition.ActiveComponent) {
          // already assigned for same class, do not reassign
          continue;
        }
        let c = new composition.ActiveComponent();
        c.emit(CompositeParentChangeEvent, c, this.component);
        (this.component as any)[composition.propertyName] = c;
      }
    }

    /** Destroy all active components (called when component is deactived) */
    private _destroyComponents() {
      if (!this.compositeBindings || this.component.managedState === ManagedState.ACTIVE) {
        return;
      }

      // clear all component properties
      for (let p in this.component[HIDDEN_COMPOSE_PROPERTY]) {
        let composition = this.component[HIDDEN_COMPOSE_PROPERTY][p];
        (this.component as any)[composition.propertyName] = undefined;
      }
      this.compositeBindings.clear();
      this.compositeBindings = undefined;
    }
  }
  ComponentObserver.handle({
    CompositeParentChange(e: ManagedEvent) {
      if (e instanceof CompositeParentChangeEvent) {
        this.setCompositeParent(e.composite);
      }
    },
  });
  Component.observe(ComponentObserver);
}

/** Helper function to make an event handler from a preset string property */
function _makeEventHandler(handler: string) {
  if (handler.slice(-2) === "()") {
    let callMethodName = handler.slice(0, -2);
    return function(this: Component, e: ManagedEvent) {
      let composite: any = this.getCompositeParent();
      while (composite) {
        let f = composite && composite[callMethodName];
        if (typeof f === "function") return f.call(composite, e);
        composite = composite.getCompositeParent();
      }
      throw err(ERROR.Component_NotAHandler, callMethodName);
    };
  } else if (handler[0] === "+") {
    let emitName = handler.slice(1);
    return function(this: Component, e: ManagedEvent) {
      this.propagateComponentEvent(emitName, e);
    };
  } else {
    throw err(ERROR.Component_InvalidEventHandler, handler);
  }
}

/** Helper method to update a component property with given value, with some additional logic for managed lists */
function _applyPropertyValue(c: Component, p: string, v: any) {
  let o = (c as any)[p];
  if (o && o instanceof ManagedList && Array.isArray(v)) {
    // update managed lists with array items
    o.replace(
      v.map(it => {
        if (it instanceof ManagedObject) return it;
        let r = new ManagedObject();
        (r as any).value = it;
        return r;
      })
    );
  } else {
    // set property value
    (c as any)[p] = v;
  }
}

/**
 * Add a sub component to _all instances_ of this class and derived classes, which is automatically created using given constructor when the instance itself is activated. The sub component is destroyed again when the instance is deactivated or destroyed.
 * This component will serve as the composite parent object of all sub (sub) components, i.e. the target object for all bindings.
 * Refer to 'Active composition' in the Typescene documentation for more details.
 * Bindings on all other component classes passed as rest parameters are added on this composite component as well. This may be necessary if further nested components will be added dynamically _after_ calling this method.
 */
export function compose<T extends ManagedObject>(
  target: T,
  propertyKey: any,
  constructor: ComponentConstructor & (new () => Component),
  ...include: ComponentConstructor[]
): Component.Composition;
/**
 * Property decorator: Add a sub component to _all instances_ of this class and derived classes, on the decorated property.
 * @decorator
 */
export function compose(
  constructor: ComponentConstructor & (new () => Component),
  ...include: ComponentConstructor[]
): PropertyDecorator;
export function compose(constructor: any): PropertyDecorator | Component.Composition {
  let include: any[] = [];
  function addComposition<T extends Component>(target: T, propertyKey: any) {
    managedChild(target, propertyKey);
    return (target.constructor as typeof Component).presetActiveComponent(
      propertyKey,
      constructor,
      ...include
    );
  }

  // add composition right away if called as a function
  let isFn = typeof arguments[1] === "string" && arguments[2];
  for (let i = isFn ? 3 : 1; i < arguments.length; i++) {
    include.push(arguments[i]);
  }
  if (isFn) {
    constructor = arguments[2];
    return addComposition(arguments[0], arguments[1]);
  }

  // return decorator if used as such
  return (target, propertyKey) => {
    addComposition(target as any, propertyKey);
  };
}
