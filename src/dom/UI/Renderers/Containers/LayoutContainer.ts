import * as Async from "@typescene/core/Async";
import { Container, LayoutContainer, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { UpdateContext } from "../../UpdateContext";
import { Renderer as ContainerRenderer } from "./Container";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-LayoutContainer";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(LayoutContainer)
export class Renderer<T extends LayoutContainer> extends ContainerRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        // instantiate container renderer, forget about scrolling
        super(component, true);

        // create the outer element update context, to be updated with all
        // containers, and the center wrapper element
        this.element.removeChild(this.element.firstChild!);
        this.scrollWrapper = DOM.div(CSS_CLASS + "_scroll", this.mainWrapper);
        this.outerContext = new UpdateContext(this.element);

        // add watcher for scrollable (overridden)
        this.watch(() => !!component.scrollable, scrollable => {
            // set overflow to scroll or hide overflowing center content
            this.scrollWrapper.style.overflow = scrollable ? "auto" : "hidden"
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object, render main context
        var out = super.render();
        var content: any[] = [ this.scrollWrapper ];
        var component = this.component;
        var flowDirection = component.flowDirection;
        var isRTL = flowDirection === "rtl";

        // helper to render and wrap side container
        function renderSideContainer(c: Container | undefined,
            className: string, before?: boolean, above?: boolean) {
            // copy ltr/rtl flow direction if set at component level
            if (c && flowDirection) {
                Async.unobserved(() => {
                    c.flowDirection = component.flowDirection;
                });
            }

            // render container synchronously
            var out = c && c.out;
            if (out && !(c!.hidden)) {
                if (!out.wrapper || out.wrapper.firstChild !== out.element ||
                    out.wrapper.className !== className) {
                    out.wrapper = DOM.div(className, out.element);
                    out.wrapper.style.zIndex = DOM.PAGE_OPTIONS.baseZIndex
                        + (above ? 1 : 0);
                }
                before ? content.unshift(out) : content.push(out);
                return out.wrapper;
            }
        }

        // render left gutter container and find its width
        var leftComponent = isRTL ?
            component.outsideGutter : component.insideGutter;
        var leftWrapper: HTMLElement | undefined =
            renderSideContainer(leftComponent, CSS_CLASS + "_left", !isRTL);
        var leftWidth = leftWrapper && leftComponent!.width;
        leftWidth = leftWidth === "auto" ?
            (isRTL ? LayoutContainer.OUTSIDE_GUTTER_WIDTH :
                LayoutContainer.INSIDE_GUTTER_WIDTH) :
            (leftWidth || "");

        // render right gutter container and find its width
        var rightComponent = isRTL ?
            component.insideGutter : component.outsideGutter;
        var rightWrapper: HTMLElement | undefined =
            renderSideContainer(rightComponent, CSS_CLASS + "_right", isRTL);
        var rightWidth = rightWrapper && rightComponent!.width;
        rightWidth = rightWidth === "auto" ?
            (isRTL ? LayoutContainer.INSIDE_GUTTER_WIDTH :
                LayoutContainer.OUTSIDE_GUTTER_WIDTH) :
            (rightWidth || "");

        // render header container and find its height
        var headerWrapper: HTMLElement | undefined =
            renderSideContainer(component.header, CSS_CLASS + "_header", true, true);
        var headerHeight = headerWrapper && component.header!.height;
        headerHeight = headerHeight === "auto" ?
            LayoutContainer.HEADER_HEIGHT : (headerHeight || "");

        // render footer container and find its height
        var footerWrapper: HTMLElement | undefined =
            renderSideContainer(component.footer, CSS_CLASS + "_footer", false, true);
        var footerHeight = footerWrapper && component.footer!.height;
        footerHeight = footerHeight === "auto" ?
            LayoutContainer.FOOTER_HEIGHT : (footerHeight || "");

        // adjust positions of all wrappers
        this.scrollWrapper.style.top = headerHeight;
        this.scrollWrapper.style.bottom = footerHeight;
        this.scrollWrapper.style.left = leftWidth;
        this.scrollWrapper.style.right = rightWidth;

        if (leftWrapper) {
            leftWrapper.style.top = headerHeight;
            leftWrapper.style.bottom = footerHeight;
            leftWrapper.style.width = leftWidth;
        }
        if (rightWrapper) {
            rightWrapper.style.top = headerHeight;
            rightWrapper.style.bottom = footerHeight;
            rightWrapper.style.width = rightWidth;
        }
        if (headerWrapper) {
            headerWrapper.style.height = headerHeight;
        }
        if (footerWrapper) {
            footerWrapper.style.height = footerHeight;
        }

        // add all sub blocks of output
        this.outerContext.updateAsync(content, true);

        return out;
    }

    /** Layout outer element update context */
    protected outerContext: UpdateContext;

    /** Center layout wrapper (for scrollbar positioning) */
    protected scrollWrapper: HTMLElement;
}

// Add style override and apply style sheet
LayoutContainer.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Container " + CSS_CLASS, {
    ".~~": {
        display: "block"
    },
    ".~_scroll": {
        position: "absolute",
        top: "0", left: "0",
        bottom: "0", right: "0"
    },
    ".~_header": {
        position: "absolute",
        top: "0", left: "0", right: "0"
    },
    ".~_footer": {
        position: "absolute",
        bottom: "0", left: "0", right: "0"
    },
    ".~_left": {
        position: "absolute",
        top: "0", bottom: "0", left: "0"
    },
    ".~_right": {
        position: "absolute",
        top: "0", bottom: "0", right: "0"
    }
});
