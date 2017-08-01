import * as DOM from "../../DOM";
import { Style, ContainerBlock, mapComponentRenderer } from "@typescene/core/UI";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-ContainerBlock";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ContainerBlock)
export class Renderer<T extends ContainerBlock<any>> extends BlockRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // add container to output
        out.updated = this.context.updateAsync([this.component.container]);

        return out;
    }
}

// Add style override and apply style sheet
ContainerBlock.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        fontSize: "0",
        lineHeight: "0"
    }
});
