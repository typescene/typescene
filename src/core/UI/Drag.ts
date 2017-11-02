import Async, { Signal } from "../Async";
import { Component, PointerEvent } from "./";

/** Current drag operation(s) */
var instances: Drag[] = [];

/** Represents a drag operation (created by static .start(...) method) */
export abstract class Drag {
    /** Returns a list of current drag operations (for forwards compatibility, supporting multi touch); use this while handling drag events, e.g. get/set .detail with custom data, or observe coordinates) */
    public static getCurrentInstances() {
        return instances.slice();
    }

    /** @internal Platform specific non-abstract Drag base class */
    public static BaseClass: { new (event: any): Drag };

    /** Start tracking mouse movement based on given event (with initial screen coordinates); creates a new instance of a platform specific class derived from Drag with given payload data; Drop targets may listen for drag events (enter/leave/drop), and use information from the data object to respond */
    public static start(event: PointerEvent, data?: any) {
        var result = new Drag.BaseClass(event);
        if (data) result.detail.data = data;
        instances.push(result);
        return result;
    }

    /** Event payload data for this operation (sealed observable object) */
    @Async.observable_seal
    public readonly detail: Drag.DragEventDetail = {
        id: undefined, data: undefined
    };

    /** Current screen X coordinate (read-only observable, constrained) */
    public abstract readonly x: number;

    /** Current screen Y coordinate (read-only observable, constrained) */
    public abstract readonly y: number;

    /** Resolves to `this` when the observed coordinates actually change by a reasonable amount (to distinguish from a click), useful e.g. for calling `.pickUp(...)` only when resolved */
    public abstract readonly moved: PromiseLike<Drag>;

    /** Signal emitted when the drag operation completes successfully */
    public readonly Dropped = Signal.create<Drag>();

    /** Signal emitted when the drag operation is canceled */
    public readonly Canceled = Signal.create<Drag>();

    /** Constrain effective drag coordinates on (original) X and/or Y axis of the viewport, and/or contrain to stay within given component on screen (calling this method twice does not constrain further, but the constraints are replaced) */
    public abstract constrain(constrainX?: boolean, constrainY?: boolean, component?: Component): void;

    /** Make given component follow the mouse cursor while dragging */
    public abstract pickUp(component: Component, removeWhenDone?: boolean): void;

    /** Stop this drag operation, emits the `.Canceled` signal; throws an exception if this operation was already canceled or dropped */
    public cancel() {
        if (!instances.some(o => o === this))
            throw new Error("Drag operation already stopped");
        instances = instances.filter(o => o !== this);
        this.Canceled(this);
    }

    /** Accept the current drop target (i.e. perform the drop, called automatically based on input events, but can be called manually as well), emits the `.Dropped` signal; throws an exception if this operation was already canceled or dropped */
    public drop() {
        if (!instances.some(o => o === this))
            throw new Error("Drag operation already stopped");
        instances = instances.filter(o => o !== this);
        this.Dropped(this);
    }
}

export namespace Drag {
    /** Details that are emitted along with a drag event */
    export interface DragEventDetail {
        /** Platform-specific drag event identifier (may be undefined) */
        id: undefined,
        /** Application defined payload to identify the object being dragged */
        data: undefined
    };
}