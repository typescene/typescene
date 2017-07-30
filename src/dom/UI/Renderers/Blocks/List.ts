import * as Async from "@typescene/core/Async";
import { Block, Style, List, TreeList, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as BlockRenderer } from "./Block";

/** Base class names used for CSS style sheet */
const CSS_CLASS = "UI-List";
const CSS_CLASS_TREELIST = "UI-TreeList";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(List)
@mapComponentRenderer(TreeList)
export class Renderer<T extends Block> extends BlockRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // add all items and dividers, if any
        out.updated = this.context.updateAsync(this.component.getChildren(),
            false,
            this.component.renderOptions &&
            this.component.renderOptions.animateListItems);

        return out;
    }
}

// Add style override
List.addStyleOverride(Style.withClass(CSS_CLASS));
TreeList.addStyleOverride(Style.withClass(CSS_CLASS + " " + CSS_CLASS_TREELIST));
DOM.Styles.define(CSS_CLASS, {
    ".~~ > [selected]": {
        background: Async.observe(() => DOM.Styles.color.listSelectionBackground),
        color: Async.observe(() => DOM.Styles.color.listSelectionText)
    },
    ".~~ > [selected]:focus": {
        background: Async.observe(() => DOM.Styles.color.listSelectionFocusBackground),
        color: Async.observe(() => DOM.Styles.color.listSelectionFocusText),
        outlineWidth: Async.observe(() => DOM.Styles.size.listSelectionFocusOutline)
    },
});
