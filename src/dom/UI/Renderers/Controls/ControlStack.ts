import * as Async from "@typescene/core/Async";
import { Style, ControlStack, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-ControlStack";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ControlStack)
export class Renderer<T extends ControlStack> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // add a watcher for content alignment
        this.watch(() => component.horzAlign, align => {
            component.style.set("textAlign", align || "");
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // add all controls (using renderer wrappers), if any
        var content: any[] = [];
        component.content.forEach(c => {
            // add spacers in between wrapper tables to stack them up
            if (content.length) {
                var spacer = DOM.div(CSS_CLASS + "_spacer");
                spacer.style.height =
                    (component.spacing || DOM.Styles.size.controlSpacing);
                content.push(spacer);
            }
            
            // copy ltr/rtl flow direction if set at component level
            if (c && component.flowDirection) {
                Async.unobserved(() => {
                    c.flowDirection = component.flowDirection;
                });
            }

            // add wrapper tables (inline) for all controls
            var out = c && c.out;
            content.push(out);
            if (out) {
                var wrapper: HTMLElement | undefined = out.wrapper;
                if (!wrapper || wrapper.className !== CSS_CLASS + "_wrapper") {
                    wrapper = DOM.div(CSS_CLASS + "_wrapper", out.element);
                    out.wrapper = wrapper;
                }

                // shrink table itself if component is shrinkwrapped
                wrapper.style.width = c!.shrinkwrap ? "auto" : "";
            }
        });

        // update stack control element content
        out.updated = this.context.updateAsync(content, true);

        return out;
    }
}

// Add style override and apply style sheet
ControlStack.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        lineHeight: "0"
    },
    ".~_wrapper": {
        display: "inline-table",
        tableLayout: "fixed",
        borderSpacing: "0",
        width: "100%"
    }
});
