import * as Async from "@typescene/core/Async";
import { Component, Screen } from "@typescene/core/UI";
import { applyStylesheet } from "./Stylesheet";
import { Styles } from "./Styles";

/** @internal Create a <div> element with given class name and node */
export function div(className?: string, node?: Node) {
    var result = document.createElement("div");
    if (className) result.className = className;
    if (node) result.appendChild(node);
    return result;
}

/** Returns true if given component contains given DOM node */
export function contains(component: Component, node: Node) {
    // only return true if component output DOM element is equal to the
    // given DOM element, or logically contains it
    var out = component.getLastRenderedOutput();
    return !!(out && out.element && (node === out.element ||
        node.compareDocumentPosition(out.element) & 8));
}

// wait for load event, or 1s after DOMContentLoaded (wait for CSS to load
// to avoid flash of unstyled content-- but not too long), or resolve right
// away if everything is already loaded:
window.addEventListener("load", () => { Screen.resolveReady(true) });
document.addEventListener("DOMContentLoaded", function (event) {
    Async.sleep(1000).then(() => { Screen.resolveReady(true) });
});
if (document.readyState === "complete") Screen.resolveReady(true);

// apply CSS reset
Screen.ready.then(() => {
    applyStylesheet({
        "[hidden]": { display: "none !important" },
        "*": { boxSizing: "border-box" }
    });
    applyStylesheet(Styles.rebootStyles, true);
    applyStylesheet(Styles.controlStyles, true);
});

// listen for changes in window size:
var deferredDimensionsUpdate: any;
window.addEventListener("resize", () => {
    if (!deferredDimensionsUpdate) {
        deferredDimensionsUpdate = setTimeout(() => {
            deferredDimensionsUpdate = undefined;
            updateDimensions();
        }, 50);
    }
});

function updateDimensions(): any {
    // write to `.dimensions` properties, ignore readonly modifier
    var width = window.innerWidth;
    var height = window.innerHeight;
    if (width && height) {
        (<any>Screen.dimensions).width = width;
        (<any>Screen.dimensions).height = height;
        return true;
    }
}
function startUpdateDimensions() {
    if (!updateDimensions())
        setTimeout(startUpdateDimensions, 200);
}
startUpdateDimensions();

// Inject element measurement function into Component class
Async.inject(Component, {
    getActualDimensions: function (this: Component): any {
        var out = this.getLastRenderedOutput();
        var elt: HTMLElement | undefined = out && out.element;
        if (elt) {
            // take current height & width from actual component
            return {
                height: elt.offsetHeight,
                width: elt.offsetWidth
            }
        }
        else {
            // return 0x0 since nothing is visible
            return { height: 0, width: 0 };
        }
    }
});

// CustomEvent polyfill (source: MDN)
(function () {
    try {
        new CustomEvent("test");
    }
    catch (all) {
        var C = function (event: string, params?: CustomEventInit) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, !!params.bubbles, !!params.cancelable, params.detail);
            return evt;
        };
        (<any>window)["CustomEvent"] = C;
        C.prototype = (<any>window).Event.prototype;
    }
})();
