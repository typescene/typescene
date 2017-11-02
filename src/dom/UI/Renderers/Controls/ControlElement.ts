import * as Async from "@typescene/core/Async";
import { Style, ControlElement, ComponentRenderer, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { UpdateContext } from "../../UpdateContext";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Control";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ControlElement as typeof ControlElement & { new(): ControlElement })
export class Renderer<T extends ControlElement> extends ComponentRenderer<T, HTMLElement> {
    /** Instantiate the renderer for given component */
    constructor(component: T, tagName = "span") {
        super(component);

        // initialize main DOM element(s)
        this.element = document.createElement(tagName);
        this.element.id = component.uid;

        // create the element update context
        this.context = new UpdateContext(this.element);

        // add watchers for component properties
        this.watch(() => DOM.applyStyleTo(component.style, this.element));
        this.watch(() => {
            // check width AND shrinkwrap properties to set CSS width
            var w = component.width;
            if (w === "auto") w = "";
            var isPercentage = (w.slice(-1) === "%");
            if (component.shrinkwrap) {
                // set auto width, limit min/max
                Async.unobserved(() => {
                    component.style.set({
                        width: isPercentage && w || "1px",
                        minWidth: w,
                        maxWidth: w || "none"
                    });
                });
            }
            else {
                // set width manually
                Async.unobserved(() => {
                    component.style.set({
                        width: isPercentage && w || "",
                        minWidth: w,
                        maxWidth: "none"
                    });
                });
            }
        });
        this.watch(() => component.wrapText, wrapText => {
            // set white-space property (pre-wrap or pre [default])
            component.style.set({
                whiteSpace: wrapText ? "pre-wrap" : ""
            });
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render() || new ComponentRenderer.Output(
            this.component, this.element, this.context);

        // set or update flow direction mode on context and element
        this.context.flowDirection = this.component.flowDirection;
        if (this.component.flowDirection) {
            this.element.dir = this.component.flowDirection;
        }

        return <any>out as ComponentRenderer.Output<T, HTMLElement>;
    }

    /** DOM element update context */
    protected context: UpdateContext;

    /** Outer element */
    protected element: HTMLElement;
}

// Add logic for focusing and blurring control elements
Async.inject(ControlElement, {
    "@focusLiveComponent": function (this: ControlElement) {
        DOM.focus(this);
    },
    "@blurLiveComponent": function (this: ControlElement) {
        DOM.blur(this);
    }
});

// Add style override and apply style sheet
ControlElement.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        position: "relative",
        display: "table-cell",
        verticalAlign: "middle",
        borderSpacing: "initial",
        margin: "0",
        padding: "0",
        lineHeight: "normal",
        height: "100%",
        whiteSpace: "pre"
    }
});
