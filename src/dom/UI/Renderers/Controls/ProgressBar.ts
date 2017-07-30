import * as Async from "@typescene/core/Async";
import { ProgressBar, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-ProgressBar";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ProgressBar)
export class Renderer<T extends ProgressBar> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // create inner element
        var bar = this.bar = document.createElement("span");
        component.style_bar.addClass(CSS_CLASS + "_bar");
        this.element.appendChild(bar);

        // add watchers for component properties
        this.watch(() => (component.flowDirection === "rtl"), rtl => {
            component.style_bar.set("float", rtl ? "right" : "");
        });
        this.watch(() => DOM.applyStyleTo(component.style_bar, bar));
        this.watch(() => component.progress, progress => {
            component.style_bar.set("width",
                (Math.max(0, Math.min(100, progress * 100)) || 0) + "%");
        });
        this.watch(() => component.tooltipText, tooltip => {
            if (tooltip !== undefined) this.element.title = tooltip;
        });
    }

    /** The inner DOM element */
    protected bar: HTMLElement;
}

// Add style override and apply style sheet
ProgressBar.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        background: "#f2f2f2",
        height: Async.observe(() => DOM.Styles.size.text),
        boxShadow: "inset 0 1px 3px rgba(0,0,0,.2)"
    },
    ".~_bar": {
        display: "block",
        float: "left",
        height: "100%",
        background: "rgba(0,0,0,.5)",
        margin: "0",
        transition: "width 250ms ease"
    }
});
