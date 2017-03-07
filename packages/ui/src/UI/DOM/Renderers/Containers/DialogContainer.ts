import * as Async from "@typescene/async";
import { DOM } from "../../DOM";
import { DOMUpdater } from "../../DOMUpdater";
import { DOMAnimation } from "../../DOMAnimation";
import { Style } from "../../../Style";
import { Row } from "../../../Components/Blocks/Row";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { DialogContainer } from "../../../Components/Containers/DialogContainer";
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

            let out = headerRow.out;
            let className = CSS_CLASS + "_header";
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
            let className = CSS_CLASS + "_footer";
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

// Set default animations
DialogContainer.APPEAR_ANIMATION = DOMAnimation.basic.in.fadeUp.withTiming(200);
DialogContainer.DISAPPEAR_ANIMATION = DOMAnimation.basic.out.fade.withTiming(200);

// Add style override for DialogContainer and TopCloseButton
DialogContainer.addStyleOverride(Style.withClass(CSS_CLASS));
DialogContainer.TopCloseButton.addStyleOverride(
    Style.withClass(CSS_CLASS + "_topclosebutton"));

// Apply style sheet
DOM.CSS.define("UI-Container " + CSS_CLASS, {
    ".~~": new Style()
        .addShadowEffect(.75)
        .set({ background: "#fafafa", height: "auto" }),
    ".~_header": {
        background: "#fff",
        borderBottom: "1px solid #ddd",
        overflow: "hidden"
    },
    ".~_footer": {
        background: "#fff",
        borderTop: "1px solid #ddd",
        overflow: "hidden"
    },
    ".~_topclosebutton": {
        lineHeight: "0"
    },
    ".~_topclosebutton.UI-Button > button[type]": {
        fontSize: "1.5em",
        height: "auto",
        lineHeight: "1.1rem",
        fontFamily: "initial",
        top: "-.1em"
    }
});
