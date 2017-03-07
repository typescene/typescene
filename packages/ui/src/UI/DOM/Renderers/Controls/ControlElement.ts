import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { ControlElement } from "../../../Components/Controls/ControlElement";
import { ComponentRenderer, mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { DOM } from "../../DOM";
import { DOMUpdater } from "../../DOMUpdater";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Control";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(<any>ControlElement)
export class Renderer<T extends ControlElement> extends ComponentRenderer<T, HTMLElement> {
    /** Instantiate the renderer for given component */
    constructor(component: T, tagName = "span") {
        super(component);

        // initialize main DOM element(s)
        this.element = document.createElement(tagName);
        this.element.id = component.uid;

        // create the element update context
        this.context = new DOMUpdater(this.element);

        // add watchers for component properties
        this.watch(() => DOM.applyStyleTo(component.style, this.element));
        this.watch(() => {
            // check width AND shrinkwrap properties to set CSS width
            var w = component.width;
            if (w === "auto") w = "";
            var isPercentage = (w.slice(-1) === "%");
            if (component.shrinkwrap) {
                // add shrinkwrap class and set width
                Async.unobserved(() => {
                    component.style.addClass("shrinkwrap").set({
                        width: isPercentage && w || "",
                        minWidth: w,
                        maxWidth: w
                    });
                });
            }
            else {
                // remove shrinkwrap class and set width
                Async.unobserved(() => {
                    component.style.removeClass("shrinkwrap").set({
                        width: isPercentage && w || "",
                        minWidth: w,
                        maxWidth: "none"
                    });
                });
            }
        });
        this.watch(() => component.wrapText, wrapText => {
            // set white-space property (pre-wrap or pre [default])
            component.style.set({
                whiteSpace: wrapText ? "pre-wrap" : ""
            });
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render() || new ComponentRenderer.Output(
            this.component, this.element, this.context);

        return out;
    }

    /** DOM element update context */
    protected context: DOMUpdater;

    /** Outer element */
    protected element: HTMLElement;
}

// Add logic for focusing and blurring control elements
Async.inject(ControlElement, {
    "@focusLiveComponent": function (this: ControlElement) {
        DOM.focus(this);
    },
    "@blurLiveComponent": function (this: ControlElement) {
        DOM.blur(this);
    }
});

// Add style override and apply style sheet
ControlElement.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        position: "relative",
        display: "table-cell",
        verticalAlign: "middle",
        boxSizing: "border-box",
        borderSpacing: "initial",
        margin: "0",
        padding: "0",
        lineHeight: "normal",
        height: "100%",
        whiteSpace: "pre"
    },
    ".~~.shrinkwrap": {
        width: "1px",
        maxWidth: "none"
    }
});
