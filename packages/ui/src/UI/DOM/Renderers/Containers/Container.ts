import * as Async from "@typescene/async";
import { DOM } from "../../DOM";
import { DOMUpdater } from "../../DOMUpdater";
import { Style } from "../../../Style";
import { Container, FlowContainer } from "../../../Components/Containers/Container";
import { ComponentRenderer, mapComponentRenderer } from "../../../Components/ComponentRenderer";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Container";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Container)
export class Renderer<T extends Container>
    extends ComponentRenderer<T, HTMLElement> {
    /** Instantiate the renderer for given component */
    constructor(component: T, noScroll?: boolean) {
        super(component);

        // initialize main DOM element(s)
        this.cellWrapper = DOM.div(CSS_CLASS + "_layoutcell");
        this.mainWrapper = DOM.div(CSS_CLASS + "_main", this.cellWrapper);
        this.element = DOM.div(undefined, this.mainWrapper);

        // create the element update context
        this.context = new DOMUpdater(this.cellWrapper);

        // add watchers for component properties
        this.watch(() => DOM.applyStyleTo(component.style, this.element));
        this.watch(() => {
            // set max content width
            this.mainWrapper.style.maxWidth = component.maxContentWidth;

            // set vertical alignment
            this.cellWrapper.style.verticalAlign = component.vertAlign || "top";

            // set horizontal alignment
            if (component.horzAlign === "left")
                this.mainWrapper.style.margin = "0 auto 0 0";
            else if (component.horzAlign === "right")
                this.mainWrapper.style.margin = "0 0 0 auto";
            else
                this.mainWrapper.style.margin = "";

            // do not fix table width if outer width is "auto"
            if (component.style.get("width") === "auto") {
                this.mainWrapper.style.tableLayout = "auto";
                this.mainWrapper.style.width = "auto";
            }
            else {
                this.mainWrapper.style.tableLayout = "fixed";
                this.mainWrapper.style.width = "100%";
            }
        });

        // add watcher for scrollable (undesired for e.g. LayoutContainer)
        if (!noScroll) {
            this.watch(() => component.scrollable, scrollable => {
                // set overflow to scroll or hide overflowing content
                component.style.set({
                    overflow: scrollable ? "auto" : "hidden"
                });
            });
        }
    }

    /** Generate rendered component output */
    protected render(noUpdate?: boolean) {
        var component = this.component;

        // get or create the current output object
        var out = super.render() || new ComponentRenderer.Output(
            component, this.element, this.context);

        // add all components
        if (!noUpdate)
            out.updated = this.context.updateAsync(component.content);

        // focus first element if initializer had "focusFirst" set
        if (component.focusFirst) {
            DOM.focus(component);
            delete component.focusFirst;
        }

        return out;
    }

    /** DOM element update context */
    protected context: DOMUpdater;

    /** Outer element */
    protected element: HTMLElement;

    /** Main wrapper (table) */
    protected mainWrapper: HTMLElement;

    /** Sub wrapper (table cell) */
    protected cellWrapper: HTMLElement;
}

// inject scroll monitor method
Async.inject(Container, {
    "@monitorPlatformScroll": function (this: Container, callback: Function) {
        this.getRenderedOutputAsync().then(out => {
            var elt: HTMLElement = out.element;
            if (elt && elt.nodeType === 1) {
                // use _scroll element for layout containers
                var scrollElt = elt.getElementsByClassName("UI-LayoutContainer_scroll");
                if (scrollElt.length) elt = <any>scrollElt[0];

                // run the callback on scroll, resize, and first update
                let doCallback = () => {
                    var t = elt.scrollTop;
                    var b = elt.scrollHeight - (t + elt.clientHeight);
                    var l = elt.scrollLeft;
                    var r = elt.scrollWidth - (l + elt.clientWidth);
                    callback(t, b, l, r);
                }
                elt.onscroll = doCallback;
                window.addEventListener("resize", doCallback);
                out.updated && out.updated.then(() =>
                    Async.sleep(10).then(doCallback));
                doCallback();
            }
        });
    }
});

// Add style override and apply style sheet
Container.addStyleOverride(Style.withClass(CSS_CLASS));
FlowContainer.addStyleOverride(Style.withClass(
    CSS_CLASS + " " + CSS_CLASS + "-Flow"));
DOM.CSS.define(CSS_CLASS, {
    ".~~": {
        cursor: "default",
        display: "inline-block",
        boxSizing: "border-box",
        position: "relative",
        top: "0", bottom: "0",
        left: "0", right: "0",
        height: "100%",
        width: "100%",
        textAlign: "center",
        margin: "0 auto",
        overflow: "hidden",
        transition: "box-shadow 100ms ease",
        fontSize: DOM.CSS.variables["baseFontSize"]
    },
    ".~_main": {
        position: "relative",
        display: "table",
        borderSpacing: "0",
        height: "100%",
        margin: "0 auto"
    },
    ".~_layoutcell": {
        display: "table-cell",
        height: "100%"
    },
    ".~-Flow > .~_main > .~_layoutcell > .UI-Block": {
        display: "inline-block",
        verticalAlign: "top"
    }
});
