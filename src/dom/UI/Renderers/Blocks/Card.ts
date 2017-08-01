import * as Async from "@typescene/core/Async";
import { Style, Card, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
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
            // copy ltr/rtl flow direction if set at component level
            if (component.flowDirection) {
                Async.unobserved(() => {
                    component.header!.flowDirection = component.flowDirection;
                });
            }

            // render header synchronously
            let out = component.header.out;
            let className = CSS_CLASS + "_header panel-heading card-header";
            if (out && (!out.wrapper || out.wrapper.firstChild !== out.element ||
                out.wrapper.className !== className))
                out.wrapper = DOM.div(className, out.element);
            content.push(out);
        }

        // render content blocks and remove wrappers if needed
        component.content.forEach(c => {
            // copy ltr/rtl flow direction if set at component level
            if (c && component.flowDirection) {
                Async.unobserved(() => {
                    c.flowDirection = component.flowDirection;
                });
            }

            // render content synchronously
            let out = c && c.out;
            if (out) delete out.wrapper;
            content.push(out);
        });

        // render footer block and create wrapper if needed
        if (component.footer) {
            // copy ltr/rtl flow direction if set at component level
            if (component.flowDirection) {
                Async.unobserved(() => {
                    component.footer!.flowDirection = component.flowDirection;
                });
            }

            // render footer synchronously
            let out = component.footer.out;
            let className = CSS_CLASS + "_footer panel-footer card-footer";
            if (out && (!out.wrapper || out.wrapper.firstChild !== out.element ||
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
DOM.Styles.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        margin: Async.observe(() => DOM.Styles.size.controlSpacing),
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
