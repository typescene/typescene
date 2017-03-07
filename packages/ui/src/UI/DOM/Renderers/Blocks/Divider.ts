import { DOM } from "../../DOM";
import { Style } from "../../../Style";
import { Divider } from "../../../Components/Blocks/Divider";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
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
            borderWidth: "0 0 " + component.thickness,
            borderColor: component.color,
            borderStyle: component.lineStyle,
            marginTop: component.margin,
            marginBottom: component.margin,
            marginLeft: component.insetLeft,
            marginRight: component.insetRight
        }), styles => {
            component.style.set(styles);
        });
    }
}

// Add style override and apply style sheet
Divider.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        boxSizing: "content-box",
        height: "0",
        lineHeight: "0",
        fontSize: "0",
        padding: "0", margin: "0",
        border: "0"  // set by render method
    }
});
