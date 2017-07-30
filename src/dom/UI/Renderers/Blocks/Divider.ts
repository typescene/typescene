import * as Async from "@typescene/core/Async";
import * as DOM from "../../DOM";
import { Style, Divider, mapComponentRenderer } from "@typescene/core/UI";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Divider";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Divider)
export class Renderer<T extends Divider> extends BlockRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component, "hr");

        // add watcher for component style properties
        this.watch(() => ({
            borderWidth: "0 0 " + (component.thickness || "1px"),
            borderColor: component.color,
            marginTop: component.margin || ".5rem",
            marginBottom: component.margin || ".5rem",
            marginLeft: component.flowDirection === "rtl" ?
                component.insetEnd : component.insetStart,
            marginRight: component.flowDirection === "rtl" ?
                component.insetStart : component.insetEnd
        }), styles => {
            component.style.set(styles);
        });
    }
}

// Add style override and apply style sheet
Divider.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        boxSizing: "content-box",
        height: "0",
        lineHeight: "0",
        fontSize: "0",
        padding: "0", margin: "0",
        borderStyle: "solid",
        borderColor: Async.observe(() => DOM.Styles.color.divider),
        borderWidth: "0"  // set by render method
    }
});
