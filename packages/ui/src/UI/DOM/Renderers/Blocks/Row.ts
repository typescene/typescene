import { Style } from "../../../Style";
import { Row, OppositeRow, CenterRow } from "../../../Components/Blocks/Row";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { DOM } from "../../DOM";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Row";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Row)
export class Renderer<T extends Row> extends BlockRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // initialize main DOM element
        var wrapper = this.wrapper = DOM.div(CSS_CLASS + "_wrapper");
        this.element.appendChild(wrapper);
        this.context.root = wrapper;

        // add watcher to detect if all child components are shrinkwrapped
        this.watch(() => {
            return component.content.every(c => !c || c.hidden ||
                (c.shrinkwrap && !(c.width && c.width.slice(-1) === "%")));
        }, allShrunk => {
            // adjust width to compress around shrinkwrapped components
            wrapper.style.width = allShrunk ? "auto" : "100%";
        });

        // add watchers for height and spacing
        var heightIsSet = false;
        this.watch(() => {
            this.wrapper.style.borderSpacing = component.spacing + " 0";
            var h = component.height;
            if (!h || h === "auto") {
                var space = (component.verticalSpacing || component.spacing);
                this.wrapper.style.marginTop = space;
                this.wrapper.style.marginBottom = space;
                return undefined;
            }
            else {
                this.wrapper.style.marginTop = "0";
                this.wrapper.style.marginBottom = "0";
                this.wrapper.style.height = h;
                return h;
            }
        }, h => {
            if (h) {
                heightIsSet = true;
                component.style.set({
                    maxHeight: h,
                    overflow: "hidden"
                });
            }
            else if (heightIsSet) {
                heightIsSet = false;
                component.style.set({
                    maxHeight: "",
                    overflow: ""
                });
            }
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // add all components
        out.updated = this.context.updateAsync(this.component.content);

        return out;
    }

    /** Row wrapper (table) */
    protected wrapper: HTMLElement;
}

// Add style override(s) and apply style sheet
Row.addStyleOverride(Style.withClass(CSS_CLASS));
OppositeRow.addStyleOverride(Style.withClass(
    CSS_CLASS + " " + CSS_CLASS + "-Opposite"));
CenterRow.addStyleOverride(Style.withClass(
    CSS_CLASS + " " + CSS_CLASS + "-Center"));
DOM.CSS.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        lineHeight: "0",
        maxHeight: "none",
        overflow: "visible"
    },
    ".~_wrapper": {
        display: "table",
        verticalAlign: "middle"
    },
    ".~-Opposite > .~_wrapper": {
        marginLeft: "auto"
    },
    ".~-Center > .~_wrapper": {
        marginLeft: "auto",
        marginRight: "auto"
    }
});
