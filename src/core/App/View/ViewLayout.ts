import { Component, ComponentFactory } from "../../UI";

/** @internal */
export const FRAG_ID_PROP = "@_fragment_id";
/** @internal */
export const FRAG_HASH_PREFIX = "#frag:";

/** Base interface for layout view classes, implemented by typeof `Blank`, `BlankDialog`, and all derived classes */
export interface LayoutClass {
    /** [implementation] */
    new (...args: any[]): Component & { fragments: any };
    /** [implementation] */
    isLayoutClass: boolean;
};

/** Returns true if given component is a layout fragment, i.e. an instantiation of a component class (or factory) that is referenced using the `layoutFragment` decorator on a layout view class */
export function isLayoutFragment(component: Component): boolean;

/** Returns true if given component can be used as a layout fragment on given layout view, i.e. the component is an instantiation of a component class (or factory) that is referenced using the `layoutFragment` decorator on given layout view class */
export function isLayoutFragment(component: Component, layout: Component): boolean;

export function isLayoutFragment(component: Component, layout?: Component) {
    // the component must include a fragment ID property, which must also be
    // referenced by the view layout class (with matching class reference)
    var id = component && (<any>component)[FRAG_ID_PROP];
    if (id && layout) {
        return !!(<any>layout)[FRAG_HASH_PREFIX + id] &&
            (component instanceof (<any>layout)[FRAG_HASH_PREFIX + id]);
    }
    return !!id;
}

/** *Property decorator*, defines the UI Component class (or factory) referenced by the decorated static property as a layout fragment, for use with layout views (i.e. classes defined on `Layout` namespace and derived classes), such that instances of the referenced component class are added to the `fragments` object on layout view instances [decorator] */
export function layoutFragment(target: LayoutClass, id: string) {
    var componentClass = (<any>target)[id];
    if (typeof componentClass !== "function" ||
        !(componentClass.prototype instanceof Component))
        throw new Error("Invalid layout fragment component class for " + id);
    if (componentClass.prototype[FRAG_ID_PROP] &&
        componentClass.prototype[FRAG_ID_PROP] !== id)
        throw new Error("Cannot reuse fragment component class " +
            componentClass.prototype[FRAG_ID_PROP] + " as " + id);
    componentClass.prototype[FRAG_ID_PROP] = id;
    (<ComponentFactory<any>>componentClass).isFragmentFactory = true;
    target.prototype[FRAG_HASH_PREFIX + id] = componentClass;
}
