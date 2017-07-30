import * as Async from "@typescene/core/Async";
import { Component } from "@typescene/core/UI";
import { contains } from "./main";

// Inject focus state logic
Async.inject(Component, {
    "@getLiveComponentFocusState": function (this: Component) {
        var focused = document.activeElement;
        return !!(focused && contains(this, focused));
    }
});

/** Element to focus as soon as it becomes available (see `focus(...)`) */
var toFocusASAP: HTMLElement | undefined;

/** Try to focus given component, its live element (from rendered output), or the first focusable element within given component, as soon as it becomes available */
export function focus(component: Component) {
    component.getRenderedOutputAsync().then(out => {
        if (!out.element) return;

        // check which element to set focus to
        var focusable: Element | undefined;
        if ((<HTMLElement>out.element).hasAttribute &&
            (<HTMLElement>out.element).hasAttribute("tabindex")) {
            // use element itself
            focusable = out.element;
        }
        else if (out.liveElement) {
            // use live element from output
            focusable = out.liveElement;
        }
        else {
            // find focusable elements (not hidden and parent(s) not hidden)
            var elts: Array<Element | undefined> = out.element.querySelectorAll(
                "[tabindex],a[href],input:not([disabled])," +
                "button:not([disabled]),textarea:not([disabled])," +
                "select:not([disabled])");
            for (var element of elts) {
                if (!element) continue;
                var hidden = false, cur: any = element;
                while (cur && !hidden) {
                    if (cur.hasAttribute && cur.hasAttribute("hidden"))
                        hidden = true;
                    cur = cur.parentElement;
                }
                if (!hidden) {
                    focusable = cur;
                    break;
                }
            }
        }

        // focus the (first focusable) element found
        if (focusable) {
            toFocusASAP = <any>focusable;
            var tries = 0;
            let doFocus = () => {
                if (toFocusASAP !== focusable) return;
                if (toFocusASAP && document.activeElement !== toFocusASAP) {
                    // try to focus the element and keep checking back
                    toFocusASAP.focus();
                    if (tries++ < 10)
                        window.setTimeout(doFocus, tries * 2);
                }
                else {
                    // managed to focus the element, forget about it:
                    toFocusASAP = undefined;
                }
            }
            doFocus();
        }
    });
}

/** Remove focus from given component, or the currently focused element */
export function blur(component?: Component) {
    var focused: Node | undefined = <any>document.activeElement;
    if (focused) {
        // do not blur if not contained by given component
        if (component && !contains(component, focused)) return;

        // blur the currently focused element
        focused && (<any>focused).blur && (<any>focused).blur();
    }
}
