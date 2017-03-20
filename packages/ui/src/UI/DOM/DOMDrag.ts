import * as Async from "@typescene/async";
import { Component } from "../Components/Component";
import { Drag } from "../Drag";
import { Style } from "../Style";
import { DOM } from "./DOM";

/** The distance to move before the `.moved` promise gets resolved */
const PX_MOVE_THRESHOLD = 4;

/** The pace (ms) at which mouse move events take effect */
const MOUSE_MOVE_PACE = 20;

/** Represents a drag operation in the DOM context */
class DOMDrag extends Drag {
    /** Initialize the operation and start tracking mouse movement, sends drag start event to given target DOM element; starts sending drag enter and drag leave events as well */
    constructor(event: MouseEvent | PointerEvent /* TODO: | TouchEvent */) {
        super();
        this._curX.value = this._origX = event.clientX;
        this._curY.value = this._origY = event.clientY;
        var target = event.currentTarget;
        if (!target) throw new TypeError();

        (<any>target).setCapture && (<any>target).setCapture();
        this._origTarget = target;
        this.moved = new Async.Promise<DOMDrag>((resolve) => {
            this._moved_resolve = resolve;
        });

        // this function is overridden when constraining movement
        this._setCoords = (x, y) => {
            this._curX.value = x;
            this._curY.value = y;
        };

        // this function is overridden when picking up an element
        this._getTarget = (x, y) => document.elementFromPoint(x, y);

        // send event to top level element to wake up listeners
        var uiDragStart = new CustomEvent("uidragstart",
            { bubbles: true, cancelable: true, detail: this.detail });
        if (target.dispatchEvent(uiDragStart))
            addListeners();
        else
            this.cancel();
    }

    /** Resolves to true when the observed coordinates actually change by a reasonable amount (to distinguish from a click), useful e.g. for calling `.pickUp(...)` only when resolved */
    public readonly moved: PromiseLike<DOMDrag>;

    /** Current viewport X coordinate (read-only observable, constrained) */
    public get x() { return this._curX.value! }

    /** Current viewport Y coordinate (read-only observable, constrained) */
    public get y() { return this._curY.value! }

    /** Constrain effective drag coordinates on (original) X and/or Y axis of the viewport, and/or contrain to stay within given element on screen (calling this method twice does not constrain further, but the constraints are replaced) */
    public constrain(constrainX?: boolean, constrainY?: boolean, component?: Component) {
        // find the element to constrain to
        var baseElt: HTMLElement = <any>this._currentTarget || <any>this._origTarget;
        var constrainElt: HTMLElement;
        if (component) {
            var out = component.getLastRenderedOutput();
            if (out && out.element) {
                constrainElt = baseElt = out.element;
            }
        }

        var origRect = baseElt.getBoundingClientRect ?
            baseElt.getBoundingClientRect() : { left: 0, top: 0};
        var baseX = (this._curX.value! - origRect.left) + (baseElt.scrollLeft || 0);
        var baseY = (this._curY.value! - origRect.top) + (baseElt.scrollTop || 0);
        this._setCoords = (x, y) => {
            var currentRect = baseElt.getBoundingClientRect();

            // constrain on X and/or Y axis
            if (constrainX)
                x = (baseX - baseElt.scrollLeft) + currentRect.left;
            if (constrainY)
                y = (baseY - baseElt.scrollTop) + currentRect.top;

            // constrain to element on screen
            if (constrainElt) {
                if (x < currentRect.left) x = currentRect.left;
                if (x > currentRect.right) x = currentRect.right;
                if (y < currentRect.top) y = currentRect.top;
                if (y > currentRect.bottom) y = currentRect.bottom;
            }

            this._curX.value = x < 0 ? 0 : x;
            this._curY.value = y < 0 ? 0 : y;
        };

        // constrain coordinates now
        this._setCoords(this._curX.value!, this._curY.value!);
    }

    /** Make given component follow the mouse cursor while dragging; if the component does not contain a fixed-position element, the element style will be changed to use fixed absolute positioning, and a placholder will be inserted instead */
    public pickUp(component: Component, removeWhenDone?: boolean) {
        var element: HTMLElement | undefined;
        if (component) {
            var out = component.getLastRenderedOutput();
            if (out) element = out.element;
        }
        if (!element) throw new TypeError();
        if (!element.parentNode) return;

        // override component style to move it around
        var override: Style = component["@_DOMDrag_Override"];
        if (!override) {
            override = component["@_DOMDrag_Override"] = new Style({
                position: "fixed",
                bottom: "auto", right: "auto"
            });
            component.style.override(override);
        }

        // figure out (and fix) the element's position
        var rect = element.getBoundingClientRect();
        var oX = this._curX.value! - rect.left;
        var oY = this._curY.value! - rect.top;
        var placeholder = document.getElementById(
            "__drag_placeholder_" + component.uid);
        if (!placeholder) {
            placeholder = DOM.div("__drag_placeholder");
            placeholder.id = "__drag_placeholder_" + component.uid;
            placeholder.style.fontSize = "0";
            placeholder.style.lineHeight = "0";
            placeholder.style.height = rect.height + "px";
            placeholder.style.width = rect.width + "px";
            placeholder.style.margin = element.style.margin;
            element.parentNode.insertBefore(placeholder, element);
        }
        override.set({ left: oX + "px", top: oY + "px" });

        // move element while dragging
        Async.observe(() => ({
            left: (this._curX.value! - oX) + "px",
            top: (this._curY.value! - oY) + "px"
        })).subscribe(style => {
            override.set(style);
        });

        // look "through" element when checking on target
        this._getTarget = (x, y) => {
            element!.setAttribute("hidden", "hidden");
            var result = document.elementFromPoint(x, y);
            element!.removeAttribute("hidden");
            return result;
        };

        // remove element when done
        if (removeWhenDone) {
            let removeElts = () => element!.parentNode &&
                element!.parentNode!.removeChild(element!) &&
                placeholder!.parentNode!.removeChild(placeholder!);
            this.Dropped.connect(removeElts);
            this.Canceled.connect(removeElts);
        }
    }

    /** Stop the current drag operation */
    public cancel() {
        (<any>this._origTarget).releaseCapture &&
            (<any>this._origTarget).releaseCapture();
        super.cancel();

        // also send (bubbling!) uidragleave for symmetry
        var uiDragLeave = new CustomEvent("uidragleave",
            { bubbles: true, detail: this.detail });
        this._currentTarget && this._currentTarget.dispatchEvent(uiDragLeave);

        // remove mouse listeners if not dragging anymore
        if (!Drag.getCurrentInstances().length)
            removeListeners();
    }

    /** Accept the current drop target (i.e. perform the drop, primarily called automatically by mouseup handler but can be called manually); sends drop event to drop target element */
    public drop() {
        (<any>this._origTarget).releaseCapture &&
            (<any>this._origTarget).releaseCapture();

        // send event to drop target to confirm
        var uiDragDrop = new CustomEvent("uidragdrop",
            { bubbles: true, cancelable: true, detail: this.detail });
        var canceled = !(this._currentTarget &&
            this._currentTarget.dispatchEvent(uiDragDrop));
        if (canceled) {
            this.cancel();
            return;
        }
        super.drop();

        // also send (bubbling!) uidragleave for symmetry
        var uiDragLeave = new CustomEvent("uidragleave",
            { bubbles: true, detail: this.detail });
        this._currentTarget && this._currentTarget.dispatchEvent(uiDragLeave);

        // remove mouse listeners if not dragging anymore
        if (!Drag.getCurrentInstances().length)
            removeListeners();
    }

    /** Update mouse cursor screen coordinates (primarily called by mousemove handler); returns true if an element was scrolled - meaning update should be called again after a short time */
    public update(x: number, y: number) {
        var oldX = this._curX.value;
        var oldY = this._curY.value;
        this._setCoords(x, y);
        var newX = this._curX.value!, newY = this._curY.value!;

        // get target element and scroll if needed
        var target = this._getTarget(newX, newY);
        var cur = target;
        var scrolled = false;
        while (cur && !scrolled) {
            var curStyle: CSSStyleDeclaration;
            if (cur.nodeType == 1 &&
                (curStyle = window.getComputedStyle(cur)) &&
                curStyle.getPropertyValue("overflow") !== "hidden") {
                var rect = cur.getBoundingClientRect();
                if (newX < rect.left + 32 && cur.scrollLeft > 0) {
                    cur.scrollLeft = Math.max(0, cur.scrollLeft - 8);
                    scrolled = true;
                }
                if (newY < rect.top + 32 && cur.scrollTop > 0) {
                    cur.scrollTop = Math.max(0, cur.scrollTop - 8);
                    scrolled = true;
                }
                if (newX > rect.right - 32 &&
                    cur.scrollLeft < cur.scrollWidth - cur.clientWidth) {
                    cur.scrollLeft = cur.scrollLeft + 8;
                    scrolled = true;
                }
                if (newY > rect.bottom - 32 &&
                    cur.scrollTop < cur.scrollHeight - cur.clientHeight) {
                    cur.scrollTop = cur.scrollTop + 8;
                    scrolled = true;
                }
            }
            cur = <HTMLElement>cur.parentNode;
        }
        if (scrolled) {
            // might have scrolled to a new (child) target
            target = this._getTarget(newX, newY);
        }

        if (oldX !== newX || oldY !== newY) {
            // check if only now moving far enough
            if (!this._moved &&
                (Math.abs(newX - this._origX) > PX_MOVE_THRESHOLD ||
                    Math.abs(this._origY - newY) > PX_MOVE_THRESHOLD)) {
                this._moved = true;
                this._moved_resolve(this);
            }

            // inform old and new potential drop target(s)
            var oldTarget: EventTarget | Node | undefined = this._currentTarget;
            this._currentTarget = target;
            if (this._currentTarget && this._currentTarget !== oldTarget) {
                // find old drop targets that do not contain new drop target
                var leftTargets: EventTarget[] = [];
                while (oldTarget) {
                    // stop if the old target contains the new target
                    if (target.compareDocumentPosition(<any>oldTarget) & 8)
                        break;

                    // otherwise send a non-bubbling "leave" event (in reverse)
                    leftTargets.unshift(oldTarget);

                    // go up to parent element
                    do { oldTarget = (<Node>oldTarget).parentNode! }
                    while (oldTarget && !oldTarget.dispatchEvent)
                }
                leftTargets.forEach(elt => {
                    elt.dispatchEvent(new CustomEvent("uidragleave",
                        { detail: this.detail }));
                });

                // oldTarget is now the closest old parent, or null;
                // find new drop targets (child elements, up to shared parent)
                var enteredTargets: EventTarget[] = [];
                while (target && target !== oldTarget) {
                    // send a non-bubbling "enter" event (in reverse)
                    enteredTargets.unshift(target);

                    // go up to parent element
                    do { target = <any>(<Node>target).parentNode }
                    while (target && !target.dispatchEvent)
                }
                enteredTargets.forEach(elt => {
                    elt.dispatchEvent(new CustomEvent("uidragenter",
                        { detail: this.detail }));
                });
            }
        }

        return scrolled;
    }

    // shadow properties for x and y
    private _curX = new Async.ObservableValue<number>();
    private _curY = new Async.ObservableValue<number>();

    private _origX: number;
    private _origY: number;
    private _origTarget: EventTarget;
    private _currentTarget?: EventTarget;

    private _moved_resolve: (drag: DOMDrag) => void;
    private _moved: boolean;

    // functions that depend on constraint and/or picked up element
    private _getTarget: (x: number, y: number) => Element;
    private _setCoords: (x: number, y: number) => void;
}

// use this class as the primary Drag class:
Drag.BaseClass = DOMDrag;

// mousemove pacer timer (fires only after delay to improve performance)
var mouseMovePacer: number | undefined;
var lastMouseMove: MouseEvent | undefined;

// mousemove event handler, updates current drag coordinates
function onMouseMove(event: MouseEvent) {
    function doUpdate() {
        if (lastMouseMove) {
            var x = lastMouseMove.clientX;
            var y = lastMouseMove.clientY;
            try {
                Drag.getCurrentInstances().forEach(drag => {
                    (<DOMDrag>drag).update(x, y);
                });
            }
            finally {
                Async.yieldAll();
            }
        }
    }

    // pace updates, except for first one to avoid delay
    var firstUpdate = !lastMouseMove;
    lastMouseMove = event;
    if (firstUpdate) {
        doUpdate();
    }
    else if (!mouseMovePacer) {
        mouseMovePacer = window.setTimeout(() => {
            var scrolled = doUpdate();
            mouseMovePacer = undefined;
            if (scrolled) onMouseMove(lastMouseMove!);
        }, MOUSE_MOVE_PACE);
    }
}

// mouseup handler to capture drop events
function onMouseUp() {
    Drag.getCurrentInstances().forEach(d => d.drop());
    Async.yieldAll();
}

// if mouse moves out of the window while dragging, cancel drag
function onMouseOut(event: MouseEvent) {
    var movedTo = <HTMLElement>event.relatedTarget;
    if (!movedTo || movedTo.nodeName == "HTML")
        Drag.getCurrentInstances().forEach(d => d.cancel());
}

// cancel drag when esc key is pressed
function onKeyDown(event: KeyboardEvent) {
    if (event.keyCode == 27) {
        Drag.getCurrentInstances().forEach(d => d.cancel());
    }
}

// cancel text selection
var old_onSelectStart;

// helper used to remove event listeners and pacer timer
function removeListeners() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mouseout", onMouseOut);
    document.removeEventListener("keydown", onKeyDown);
    document.onselectstart = old_onSelectStart;
    mouseMovePacer && window.clearTimeout(mouseMovePacer);
    mouseMovePacer = undefined;
    lastMouseMove = undefined;
}

// helper used to add event listeners when actually dragging
function addListeners() {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("keydown", onKeyDown);
    old_onSelectStart = document.onselectstart;
    document.onselectstart = () => false;
}
