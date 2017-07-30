import { ButtonGroup, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-ButtonGroup";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ButtonGroup)
export class Renderer<T extends ButtonGroup> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);
        this.watch(() => component.vertical, vertical => {
            // set appropriate class name
            if (vertical)
                component.style.removeClass("btn-group")
                    .addClass("btn-group-vertical");
            else
                component.style.removeClass("btn-group-vertical")
                    .addClass("btn-group");
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // add all button elements
        var elements = component.buttons.map(button => {
            var buttonOut = button && button.out;
            return buttonOut && buttonOut.liveElement;
        });
        out.updated = this.context.updateAsync(elements);

        return out;
    }
}

// Add style override and apply style sheet
ButtonGroup.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~ button": {
        float: "none"
    }
});
