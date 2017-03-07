import { DOM } from "../../DOM";
import { DOMUpdater } from "../../DOMUpdater";
import { Style } from "../../../Style";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { Container } from "../../../Components/Containers/Container";
import { LayoutContainer } from "../../../Components/Containers/LayoutContainer";
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
        this.scrollWrapper.style.zIndex = "0";
        this.outerContext = new DOMUpdater(this.element);

        // add watcher for scrollable (overridden)
        this.watch(() => component.scrollable, scrollable => {
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

        // helper to render and wrap side container
        function renderSideContainer(c: Container | undefined,
            className: string, before?: boolean) {
            var out = c && c.out;
            if (out && !(c!.hidden)) {
                if (!out.wrapper || out.wrapper.className !== className) {
                    out.wrapper = DOM.div(className, out.element);
                    out.wrapper.style.zIndex = DOM.PAGE_OPTIONS.baseZIndex;
                }
                before ? content.unshift(out) : content.push(out);
                return out.wrapper;
            }
        }

        // render header container and find its height
        var headerWrapper: HTMLElement | undefined =
            renderSideContainer(component.header, CSS_CLASS + "_header", true);
        var headerHeight = headerWrapper && component.header!.height;
        headerHeight = headerHeight === "auto" ?
            LayoutContainer.HEADER_HEIGHT : (headerHeight || "0");

        // render footer container and find its height
        var footerWrapper: HTMLElement | undefined =
            renderSideContainer(component.footer, CSS_CLASS + "_footer");
        var footerHeight = footerWrapper && component.footer!.height;
        footerHeight = footerHeight === "auto" ?
            LayoutContainer.FOOTER_HEIGHT : (footerHeight || "0");

        // render left gutter container and find its width
        var leftWrapper: HTMLElement | undefined =
            renderSideContainer(component.leftGutter, CSS_CLASS + "_left", true);
        var leftWidth = leftWrapper && component.leftGutter!.width;
        leftWidth = leftWidth === "auto" ?
            LayoutContainer.LEFT_GUTTER_WIDTH : (leftWidth || "0");

        // render right gutter container and find its width
        var rightWrapper: HTMLElement | undefined =
            renderSideContainer(component.rightGutter, CSS_CLASS + "_right");
        var rightWidth = rightWrapper && component.rightGutter!.width;
        rightWidth = rightWidth === "auto" ?
            LayoutContainer.RIGHT_GUTTER_WIDTH : (rightWidth || "0");

        // adjust positions of all wrappers
        this.scrollWrapper.style.top = headerHeight;
        this.scrollWrapper.style.bottom = footerHeight;
        this.scrollWrapper.style.left = leftWidth;
        this.scrollWrapper.style.right = rightWidth;

        if (leftWrapper) {
            leftWrapper.style.top = headerHeight;
            leftWrapper.style.bottom = footerHeight;
        }
        if (rightWrapper) {
            rightWrapper.style.top = headerHeight;
            rightWrapper.style.bottom = footerHeight;
        }

        // add all sub blocks of output
        this.outerContext.updateAsync(content, true);

        return out;
    }

    /** Layout outer element update context */
    protected outerContext: DOMUpdater;

    /** Center layout wrapper (for scrollbar positioning) */
    protected scrollWrapper: HTMLElement;
}

// Add style override and apply style sheet
LayoutContainer.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Container " + CSS_CLASS, {
    ".~~": {
        display: "block"
    },
    ".~_scroll": {
        position: "absolute"
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
        left: "0"
    },
    ".~_right": {
        position: "absolute",
        right: "0"
    }
});
