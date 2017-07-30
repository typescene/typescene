import * as Async from "@typescene/core/Async";
import { Style, Row, mapComponentRenderer, DialogContainer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { DOMAnimation } from "../../DOM/DOMAnimation";
import { Renderer as ContainerRenderer } from "./Container";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-DialogContainer";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(DialogContainer)
export class Renderer<T extends DialogContainer> extends ContainerRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // add watcher for width to set max width instead
        this.watch(() => component.width, w => {
            component.style.set({
                width: w === "auto" ? "auto" : "100%",
                maxWidth: w === "auto" ? "none" : w
            });
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render(true);
        var component = this.component;

        // render header block and create wrapper if needed
        var content: any[] = [];
        if (component.header) {
            // fix vertical spacing for a more "native" look if none set
            var headerRow = component.header;
            if (headerRow instanceof Row && !headerRow.verticalSpacing) {
                Async.unobserved(() => {
                    (<Row>headerRow).verticalSpacing = ".65rem";
                });
            }

            // copy ltr/rtl flow direction if set at component level
            if (component.flowDirection) {
                Async.unobserved(() => {
                    headerRow.flowDirection = component.flowDirection;
                });
            }

            // render header synchronously
            let out = headerRow.out;
            let className = CSS_CLASS + "_header";
            if (out && (!out.wrapper || out.wrapper.firstChild !== out.element ||
                out.wrapper.className !== className)) {
                var w = out.wrapper = DOM.div(className, out.element);
                w.onselectstart = e => e.preventDefault();
                w.onmousedown = e => component.header && component.header.Pressed(e);
            }
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
            let className = CSS_CLASS + "_footer";
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

// Set default animations
DialogContainer.APPEAR_ANIMATION = DOMAnimation.basic.in.fadeUp.withTiming(200);
DialogContainer.DISAPPEAR_ANIMATION = DOMAnimation.basic.out.fade.withTiming(200);

// Add style override for DialogContainer and TopCloseButton
DialogContainer.addStyleOverride(Style.withClass(CSS_CLASS));
DialogContainer.TopCloseButton.addStyleOverride(
    Style.withClass(CSS_CLASS + "_topclosebutton"));

// Apply style sheet
DOM.Styles.define("UI-Container " + CSS_CLASS, {
    ".~~": new Style()
        .addShadowEffect(.75)
        .set({
            height: "auto",
            background: Async.observe(() => DOM.Styles.color.background),
            color: Async.observe(() => DOM.Styles.color.text),
            borderRadius: Async.observe(() => DOM.Styles.size.dialogBorderRadius)
        }),
    ".~_header": {
        overflow: "hidden"
    },
    ".~_footer": {
        overflow: "hidden"
    },
    ".~_topclosebutton": {
        lineHeight: "0"
    },
    ".~_topclosebutton.UI-TextButton.UI-Button > button[type]": {
        fontSize: "1.5em",
        height: "auto",
        lineHeight: "1.1rem",
        fontFamily: "initial",
        top: "-.1em"
    }
});
