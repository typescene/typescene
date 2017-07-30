import Async from "../../../Async";
import { Component, LayoutContainer, DialogContainer, ComponentFactory } from "../../../UI";
import { FRAG_HASH_PREFIX, FRAG_ID_PROP } from "../ViewLayout";

/** Helper function to initialize layout view instances: add a `.fragments` object with observable properties for all fragments that have been declared using `@layoutFragment` */
function _initLayout(target: BaseLayout | BaseDialogLayout) {
    (<any>target).fragments = new Async.ObservableObject();
    for (var id in target) {
        if (id[0] === "#" && id.slice(0, 6) === FRAG_HASH_PREFIX)
            Async.makePropertyObservable(target.fragments, id.slice(6));
    }
}

/** Helper function to implement `.appendChild` method on layout view classes */
function _appendChild(target: BaseLayout | BaseDialogLayout, child?: Component,
    recurse?: boolean): any {
    if (!recurse && child instanceof Async.ObservableValue) {
        return child.map(v => _appendChild(target, v, true));
    }

    // check for fragments with a fragment ID
    var id = child && (<any>child)[FRAG_ID_PROP];
    if (id) {
        // check if target defines same ID with matching component class
        if (!(<any>target)[FRAG_HASH_PREFIX + id] || !(child instanceof (<any>target)[FRAG_HASH_PREFIX + id]))
            throw new Error("Invalid fragment type for this layout: " + id);
        target.fragments[id] = child;
        return undefined;
    }
    return child;
}

/** Represents a container layout, can be extended to define container-based layouts and their associated layout fragments (using `layoutFragment` on static properties) */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block, true)
export class BaseLayout extends LayoutContainer {
    /** Dummy property for duck typing of layout classes */
    static readonly isLayoutClass: true = true;

    /** Create a new instance of this layout view */
    constructor() { super(); _initLayout(this); }

    /** Observable object that contains all fragments that have been added using `.appendChild(...)` or through a component factory (i.e. static `.with(...)` method), indexed by ID */
    public readonly fragments: { [name: string]: Component | undefined } & Async.ObservableObject;

    /** Add a child component to this component, or store a view fragment in the `.fragments` object; returns this */
    public appendChild(child?: Component): this {
        child = <any>_appendChild(this, child);
        if (child !== undefined) super.appendChild(child);
        return this;
    }

    /** Set given observable property of this component to given named fragment (observed property of `.fragments` object), with optional transformation function (run inside the observable context, for e.g. conditional assignment) */
    public bindFragment(propertyName: keyof this, fragmentName: string, transform?: (fragment: Component | undefined) => Component | undefined) {
        if (!this.hasObservableProperty(propertyName))
            throw new Error("Property " + propertyName + " is not observable");
        this[propertyName] = <any>Async.observe(() => {
            var fragment = this.fragments[fragmentName];
            return transform ? transform(fragment) : fragment;
        });
    }
}

/** Represents a dialog layout, can be extended to define dialog container-based layouts and their associated layout fragments (using `layoutFragment` on static properties) */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block, true)
export class BaseDialogLayout extends DialogContainer {
    /** Dummy property for duck typing of layout classes */
    static readonly isLayoutClass: true = true;

    /** Create a new instance of this layout view */
    constructor() { super(); _initLayout(this); }

    /** Observable object that contains all fragments that have been added using `.appendChild(...)` or through a component factory (i.e. static `.with(...)` method), indexed by ID */
    public readonly fragments: { [name: string]: Component | undefined } & Async.ObservableObject;

    /** Add a child component to this component, or store a view fragment in the `.fragments` object; returns this */
    public appendChild(child?: Component): this {
        child = <any>_appendChild(this, child);
        if (child !== undefined) super.appendChild(child);
        return this;
    }

    /** Set given observable property of this component to given named fragment (observed property of `.fragments` object), with optional transformation function (run inside the observable context, for e.g. conditional assignment) */
    public bindFragment(propertyName: keyof this, fragmentName: string, transform?: (fragment: Component | undefined) => any) {
        if (!this.hasObservableProperty(propertyName))
            throw new Error("Property " + propertyName + " is not observable");
        this[propertyName] = <any>Async.observe(() => {
            var fragment = this.fragments[fragmentName];
            return transform ? transform(fragment) : fragment;
        });
    }
}
