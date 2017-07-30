import { Icon, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";
import { Renderer as LabelRenderer } from "./Label";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Icon";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Icon)
export class Renderer<T extends Icon> extends ControlRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // render text into DOM element
        LabelRenderer.renderInto(this.element, component.icon);

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.element.title = component.tooltipText;

        return out;
    }
}

// Add style override and apply style sheet
Icon.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        cursor: "inherit",
        textAlign: "center",
        lineHeight: "1em"
    }
});
