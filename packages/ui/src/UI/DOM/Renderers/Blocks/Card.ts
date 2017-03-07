import { DOM } from "../../DOM";
import { Style } from "../../../Style";
import { Block } from "../../../Components/Blocks/Block";
import { Card } from "../../../Components/Blocks/Card";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Card";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Card)
export class Renderer<T extends Card> extends BlockRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // render header block and create wrapper if needed
        var content: any[] = [];
        if (component.header) {
            let out = component.header.out;
            let className = CSS_CLASS + "_header panel-heading card-header";
            if (out && (!out.wrapper ||
                out.wrapper.className !== className))
                out.wrapper = DOM.div(className, out.element);
            content.push(out);
        }

        // render content blocks and remove wrappers if needed
        component.content.forEach(c => {
            let out = c && c.out;
            if (out) delete out.wrapper;
            content.push(out);
        });

        // render footer block and create wrapper if needed
        if (component.footer) {
            let out = component.footer.out;
            let className = CSS_CLASS + "_footer panel-footer card-footer";
            if (out && (!out.wrapper ||
                out.wrapper.className !== className))
                out.wrapper = DOM.div(className, out.element);
            content.push(out);
        }

        // add all sub blocks output
        out.updated = this.context.updateAsync(content, true);

        return out;
    }
}

// Add style override and apply style sheet
Card.addStyleOverride(Style.withClass(CSS_CLASS + " panel panel-default card"));
DOM.CSS.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        margin: "1rem",
        padding: "0",
        height: "auto",
        width: "auto",
        overflow: "hidden"
    },
    ".~_header": {
        padding: "0",
        overflow: "hidden"
    },
    ".~_footer": {
        padding: "0",
        overflow: "hidden"
    },

    // do not add margin to cards used within rows
    ".UI-Control > .~~": {
        margin: "0"
    }
});
