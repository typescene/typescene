import * as Async from "@typescene/async";
import { Drag } from "../Drag";
import { Component } from "./Component";

/** Signal that is emitted by a component instance as the result of a user action */
export class ComponentSignal<DataT> extends Async.Signal<DataT> {
    /** Component for which this signal will be emitted */
    public static readonly component: Component;
}

export namespace ComponentSignal {
    /** Type definition for a callable (emittable) component signal *class*; the type parameters represent handler function arguments: signal payload, and emitted signal base class, which has a static `component` property that refers to the emitting component */
    export interface Emittable<T, SignalClassT extends typeof ComponentSignal> extends Async.Signal.Emittable<T, SignalClassT> {
        /** Emit a signal with given value, for the component this signal is attached to */
        (data?: T): void;
        /** Component for which this signal will be emitted */
        readonly component: Component;
    }
}

/** Abstract wrapper for a handler that can connect to signals derived from `ComponentSignal`; used for automatic type inference of signal handlers */
export interface ComponentSignalHandler<DataT, SignalClassT extends typeof ComponentSignal>
    extends Function {
    /** Call the handler as a function */
    (data?: DataT, src?: SignalClassT): void;

    /** Add this EventHandler as a handler for given event signal */
    connectTo(signal: ComponentSignal.Emittable<DataT, SignalClassT>): Async.SignalConnection;

    /** Always true, for duck typing wrapped handlers */
    isEventHandler: true;
}

/** [implementation] "Constructor" wrapper for a UI signal handler */
export abstract class ComponentSignalHandler<DataT, SignalClassT extends typeof ComponentSignal> {
    constructor(f: (data: DataT, src: SignalClassT) => void) {
        if (!this || !this.constructor ||
            this.constructor !== ComponentSignalHandler &&
            !(this.constructor.prototype instanceof ComponentSignalHandler))
            throw new TypeError();
        var result: ComponentSignalHandler<DataT, any> = <any>f;
        result.connectTo = function (this: ComponentSignalHandler<DataT, any>, signal) {
            return signal.connect(this);
        }
        result.isEventHandler = true;
        return <any>result;
    }
}

/** @internal Returns a new component signal class specific to a component, with given signal base class */
export function defineComponentSignal<DataT, SignalClassT extends typeof ComponentSignal>(
    base: SignalClassT & (new (data: DataT) => ComponentSignal<DataT>),
    component: Component, properties = {}):
    SignalClassT & ComponentSignal.Emittable<DataT, SignalClassT> {
    var sig = Async.defineSignal<SignalClassT, DataT>(base, properties);
    (<any>sig).component = component;
    return <any>sig; // ignore missing "component" property
}

/** Interface definition of a platform agnostic keyboard event */
export interface KeyboardEvent {
    /** True if `alt` key is held down */
    altKey?: boolean;
    /** True if `ctrl` key is held down */
    ctrlKey?: boolean;
    /** True if `meta` key is held down */
    metaKey?: boolean;
    /** True if `shift` key is held down */
    shiftKey?: boolean;

    /** Key code, used with key up/down events */
    keyCode?: number;

    /** Character code (usually ASCII), used with key press events */
    which?: number;

    /** Stop the default action for this event from taking place */
    preventDefault?: () => void;
}

/** Interface definition of a platform agnostic mouse/pointer event */
export interface PointerEvent {
    /** True if `alt` key is held down */
    altKey?: boolean;
    /** True if `ctrl` key is held down */
    ctrlKey?: boolean;
    /** True if `meta` key is held down */
    metaKey?: boolean;
    /** True if `shift` key is held down */
    shiftKey?: boolean;

    /** Mouse button affected: 0 = primary, 2 = secondary */
    button?: number;

    /** Horizontal coordinate relative to the browser window */
    clientX?: number;

    /** Vertical coordinate relative to the browser window */
    clientY?: number;

    /** Stop the default action for this event from taking place */
    preventDefault?: () => void;
}

/** Interface definition of a drag event with payload */
export interface DragEvent {
    /** Event payload */
    detail: Drag.DragEventDetail;
}

/** Constructor for a component signal handler (no event data) */
export class ActionHandler extends ComponentSignalHandler<never, typeof ComponentSignal> { }

/** Signal that is emitted when a keyboard event occurs */
export class KeyEventSignal extends ComponentSignal<KeyboardEvent> { }

/** Constructor for a keyboard event handler */
export class KeyHandler extends ComponentSignalHandler<KeyboardEvent, typeof KeyEventSignal> { }

/** Signal that is emitted when a mouse/pointer event occurs */
export class PointerEventSignal extends ComponentSignal<PointerEvent> { }

/** Constructor for a mouse/pointer event handler */
export class PointerHandler extends ComponentSignalHandler<PointerEvent, typeof PointerEventSignal> { }

/** Signal that is emitted when a custom drag event occurs */
export class DragEventSignal extends ComponentSignal<DragEvent> { }

/** Constructor for a drag event handler */
export class DragHandler extends ComponentSignalHandler<DragEvent, typeof DragEventSignal> { }
