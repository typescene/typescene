import { Style, Row, OppositeRow, CenterRow, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
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
    
        // add watcher for horizontal alignment
        this.watch(() => {
            var horzAlign = component.horzAlign;
            if (component.flowDirection === "rtl") {
                if (horzAlign === "start") return "right";
                if (horzAlign === "end") return "left";
            }
            else if (horzAlign === "start") return "";
            else if (horzAlign === "end") return "right";
            return horzAlign;
        }, horzAlign => {
            switch (horzAlign) {
                case "center":
                    this.wrapper.style.marginLeft = "auto";
                    this.wrapper.style.marginRight = "auto";
                    break;
                case "right":
                    this.wrapper.style.marginLeft = "auto";
                    this.wrapper.style.marginRight = "0";
                    break;
                case "left":
                    this.wrapper.style.marginLeft = "0";
                    this.wrapper.style.marginRight = "auto";
                    break;
                default:
                    this.wrapper.style.marginLeft = "";
                    this.wrapper.style.marginRight = "";
                    break;
            }
        });

        // add watchers for height and spacing
        var heightIsSet = false;
        this.watch(() => {
            var spacing = component.spacing || DOM.Styles.size.controlSpacing;
            this.wrapper.style.borderSpacing = spacing + " 0";
            var h = component.height;
            if (!h || h === "auto") {
                var space = (component.verticalSpacing || spacing);
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
DOM.Styles.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        lineHeight: "0",
        maxHeight: "none",
        overflow: "visible"
    },
    ".~_wrapper": {
        display: "table",
        verticalAlign: "middle"
    }
});
