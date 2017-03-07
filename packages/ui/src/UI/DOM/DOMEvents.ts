import * as Async from "@typescene/async";
import { Component } from "../Components/Component";
import { ComponentSignal, PointerEventSignal, KeyEventSignal, DragEventSignal, defineComponentSignal, KeyboardEvent, PointerEvent } from "../Components/ComponentSignal";

// lookup table for custom event names
const customEventNames = {
    DoubleClick: "dblclick",
    Press: "mousedown",
    MouseEnter: "mouseover",
    MouseLeave: "mouseout",
    FnKeyPressed: "keydown",
    DragStart: "uidragstart",
    DragEnter: "uidragenter",
    DragLeave: "uidragleave",
    DragDrop: "uidragdrop",
    FocusGained: "uicustomfocusin",
    Clicked: "uiasyncclick",
    DoubleClicked: "uiasyncdblclick",
    Pressed: "uiasyncpress",
    ValueChange: "change",
    ValueInput: "input"
};

/** Helper function to get the DOM event name for given signal name */
function _getName(signalName: string) {
    return customEventNames[signalName] || signalName.toLowerCase();
}

/** Signal that is emitted by a component instance as the result of a DOM event (type definition of mixed-in properties) */
interface DOMSignalClass extends ComponentSignal.Emittable<Event, typeof ComponentSignal> {
    /** Name of the event for which this signal will be emitted */
    domEventName: string;

    /** True if capture mode is used for the DOM event listener, and the event should not be consumed; if false, the DOM event listener is added as a bubbling event listener, and the event is always consumed (using stopPropagation) */
    useCapture?: boolean;

    /** Event filter function, if any; should return true if event should be handled, false if event should not be handled but should be consumed (if not in capture mode), or undefined if event should not be handled nor consumed */
    domEventFilter?: (event: any) => (boolean | undefined);

    /** Currently attached event handler */
    domEventHandler?: (event: Event) => void;

    /** Current focus ('gained') state, if applicable */
    domAsyncFocus?: boolean;
}

/** Called when a first handler is added (mixin) */
function onHandlerConnected(this: DOMSignalClass) {
    // when connected: add event handler when element is known
    this.component.getRenderedOutputAsync().then(out => {
        let addHandler = () => {
            this.domEventHandler = (event: Event) => {
                var test = (this.isConnected() || undefined) &&
                    (!this.domEventFilter || this.domEventFilter(event));
                if (test !== undefined) {
                    // consume the event if not in capture mode
                    if (!this.useCapture) event.stopPropagation();

                    // emit signal now and wait for handlers to be called
                    // (unless filter function returned false)
                    if (test) {
                        (<any>this)(event);
                        var passed = false;
                        Async.defer(() => { passed = true });
                        while (!passed && Async.yieldAll());
                    }
                }
            };
            (out.liveElement || out.element).addEventListener(
                this.domEventName, this.domEventHandler, this.useCapture);
        }
        if (!this.domEventHandler) {
            // add handler only after rendering, if possible
            if (out.updated) out.updated.then(addHandler);
            else addHandler();
        }
    });
}

/** Called when all handlers have been disconnected (mixin) */
function onHandlersDisconnected(this: DOMSignalClass) {
    // when disconnected: remove event handler
    this.component.getRenderedOutputAsync().then(out => {
        if (this.domEventHandler && !this.isConnected) {
            (out.liveElement || out.element).removeEventListener(
                this.domEventName, this.domEventHandler);
            delete this.domEventHandler;
        }
    });
}

// inject a method to create DOM event signals into the Component class
Async.inject(Component, {
    "@createEventSignal": function <T, S extends typeof ComponentSignal>(
        this: Component, id: string,
        signalClass: S & { new (data: T): any }, opt?: any) {
        var result: ComponentSignal.Emittable<any, typeof ComponentSignal>;
        var domEventFilter: ((event: any) => (boolean | undefined)) | undefined;
        var useCapture = true;
        switch (id) {
            case "Press":
            case "Click":
            case "DoubleClick":
            case "MouseContextMenu":
                // only emit if the element is not disabled (e.g. button)
                domEventFilter = (event: MouseEvent) => {
                    return !((<any>event.currentTarget).disabled);
                };
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id), useCapture, domEventFilter,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            case "Pressed":
            case "Clicked":
            case "DoubleClicked":
                // only emit if the element is not disabled (e.g. button)
                domEventFilter = (event: MouseEvent) => {
                    return !((<any>event.currentTarget).disabled);
                };
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id), domEventFilter,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            case "MouseEnter":
            case "MouseLeave":
                // only emit if there is no source/destination target, or
                // if the source/destination target is the current element, or
                // if the source/destination is outside of the current element
                // (i.e. current element does not contain source/destination)
                domEventFilter = (event: MouseEvent) => (!event.relatedTarget ||
                    //event.relatedTarget === event.currentTarget ||
                    event.relatedTarget !== event.currentTarget &&
                    !((<Node>event.relatedTarget).compareDocumentPosition(
                        <Node>event.currentTarget) & 8));
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id),
                    domEventFilter, useCapture,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            case "FnKeyPressed":
                domEventFilter = event => (event.keyCode == opt || undefined);
                useCapture = false;
            case "KeyDown":
            case "KeyPress":
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id),
                    domEventFilter, useCapture,
                    onHandlerConnected, onHandlersDisconnected,
                });
                break;

            case "Focus":
            case "Blur":
            case "ValueChange":
            case "ValueInput":
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id), useCapture,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            case "FocusGained":
                domEventFilter = (event: CustomEvent) => {
                    if (!(<DOMSignalClass>result).domAsyncFocus) {
                        (<DOMSignalClass>result).domAsyncFocus = true;

                        // add a re-focus listener to the list
                        var componentElt = event.currentTarget;
                        onRefocusCallbacks.push(elt => {
                            // ignore if not blurred and not focused self or child
                            if (elt && (elt === componentElt ||
                                (<Node>event.target).compareDocumentPosition(
                                    <Node>componentElt) & 8))
                                return true;

                            // otherwise, emit FocusLost and remove listener
                            (<DOMSignalClass>result).domAsyncFocus = false;
                            this.FocusLost(_lastBlurEvent);
                            return false;
                        });

                        // emit the FocusGained signal now
                        return true;
                    }

                    // if already focused, do not emit but consume the event
                    return false;
                };
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id), domEventFilter,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            case "FocusLost":
                // do not listen to DOM events at all; this signal is emitted
                // from the callback added to onRefocusCallbacks by FocusGained
                result = defineComponentSignal(signalClass, this);
                break;

            case "DragEnter":
            case "DragLeave":
                useCapture = false;
            case "DragStart":
            case "DragDrop":
                result = defineComponentSignal(signalClass, this, {
                    domEventName: _getName(id), useCapture,
                    onHandlerConnected, onHandlersDisconnected
                });
                break;

            default:
                throw new TypeError();
        }
        return result;
    }
});

/** List of callbacks that are called with a newly focused element, or undefined if none; to dispatch a non-bubbling FocusLost event if the focus moved outside of the originally focused component; callbacks return true if focus was not lost (callback stays in the list) or false otherwise */
var onRefocusCallbacks: Array<(newFocus?: Element) => boolean> = [];

/** Last blur event that occurred, waiting for another focus event or timeout */
var _lastBlurEvent: FocusEvent | undefined;

/** Current timer ID for blur event listener callback */
var _blurTimeout: number | undefined;

// listen for focus/blur events to manage FocusGained/Lost behavior
document.addEventListener("focus", event => {
    // check if blur timeout is active (waiting for re-focus)
    if (_lastBlurEvent) {
        // pass newly focused element to listeners, stop waiting
        onRefocusCallbacks = onRefocusCallbacks.filter(
            f => f(<any>event.target));
        clearTimeout(_blurTimeout!);
        _lastBlurEvent = undefined;
    }

    // dispatch custom event to trigger FocusGained on newly focused element
    // (bubbles so that it can be consumed normally by connecting to signal)
    var canceled = !event.target.dispatchEvent(new CustomEvent(
        customEventNames["FocusGained"],
        { bubbles: true, cancelable: true }));
    if (canceled) event.preventDefault();
}, true);
document.addEventListener("blur", event => {
    if (!onRefocusCallbacks.length) return;

    // set a timeout to wait for possible focus events
    _blurTimeout = setTimeout(() => {
        // no re-focus occurred, inform all listeners
        onRefocusCallbacks.forEach(f => f());
        onRefocusCallbacks.length = 0;
        _lastBlurEvent = undefined;
    }, 0);
    _lastBlurEvent = event;
}, true);

// listen to click/dblclick/press and dispatch asynchronous events
function addAsyncEvent(origEvent: string, asyncEvent: string) {
    document.addEventListener(origEvent, event => {
        var target = event.target;
        setTimeout(() => {
            target.dispatchEvent(new CustomEvent(asyncEvent,
                { bubbles: true, cancelable: true }));
        }, 0);
    }, true);
}
addAsyncEvent("click", customEventNames["Clicked"]);
addAsyncEvent("dblclick", customEventNames["DblClicked"]);
addAsyncEvent("mousedown", customEventNames["Pressed"]);
