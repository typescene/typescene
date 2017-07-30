import * as Async from "@typescene/core/Async";
import { Component, Style, Block, ComponentRenderer, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { UpdateContext } from "../../UpdateContext";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Block";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Block)
export class Renderer<T extends Block> extends ComponentRenderer<T, HTMLElement> {
    /** Instantiate the renderer for given component */
    constructor(component: T, tagName = "div") {
        super(component);

        // initialize main DOM element(s)
        this.element = document.createElement(tagName);

        // create the element update context
        this.context = new UpdateContext(this.element);

        // add watchers for component properties
        var positionStyle: Style | undefined;
        this.watch(() => DOM.applyStyleTo(component.style, this.element));
        this.watch(() => component.focusMode, focusMode => {
            if (focusMode === Component.FocusMode.Auto) {
                // make element focusable through the DOM
                this.element.tabIndex = 0;
            }
            else if (focusMode === Component.FocusMode.Click) {
                // make element focusable manually
                this.element.tabIndex = -1;
            }
            else {
                // make element no longer focusable in the DOM directly
                this.element.removeAttribute("tabIndex");
            }
        });
        this.watch(() => {
            // get overlay position and translate ltr/rtl mode values
            var pos = component.overlayPosition;
            if (component.flowDirection === "rtl") {
                if (pos === Block.OverlayPosition.TopStart)
                    return Block.OverlayPosition.TopRight;
                if (pos === Block.OverlayPosition.TopEnd)
                    return Block.OverlayPosition.TopLeft;
                if (pos === Block.OverlayPosition.BottomStart)
                    return Block.OverlayPosition.BottomRight;
                if (pos === Block.OverlayPosition.BottomEnd)
                    return Block.OverlayPosition.BottomLeft;
            }
            else {
                if (pos === Block.OverlayPosition.TopStart)
                    return Block.OverlayPosition.TopLeft;
                if (pos === Block.OverlayPosition.TopEnd)
                    return Block.OverlayPosition.TopRight;
                if (pos === Block.OverlayPosition.BottomStart)
                    return Block.OverlayPosition.BottomLeft;
                if (pos === Block.OverlayPosition.BottomEnd)
                    return Block.OverlayPosition.BottomRight;
            }
            return pos;
        }, pos => {
            if (pos === undefined) {
                // clear positioning styles if needed
                positionStyle && positionStyle.set({
                    position: "", top: "", left: "",
                    bottom: "", right: "",
                    marginTop: "", marginBottom: "",
                    marginLeft: "", marginRight: ""
                });
                return;
            }
            if (!positionStyle) {
                // override styles with positioning styles
                component.style.override(positionStyle = new Style());
            }

            // apply positioning styles (absolute position)
            var top = "auto", bottom = "auto", left = "auto", right = "auto";
            var marginLeft = "", marginRight = "";
            switch (pos) {
                case Block.OverlayPosition.TopLeft:
                    marginRight = "auto";
                    top = left = "0"; break;
                case Block.OverlayPosition.TopRight:
                    marginLeft = "auto";
                    top = right = "0"; break;
                case Block.OverlayPosition.Top:
                    marginLeft = marginRight = "auto";
                    top = left = right = "0"; break;
                case Block.OverlayPosition.BottomLeft:
                    marginRight = "auto";
                    bottom = left = "0"; break;
                case Block.OverlayPosition.BottomRight:
                    marginLeft = "auto";
                    bottom = right = "0"; break;
                case Block.OverlayPosition.Bottom:
                    marginLeft = marginRight = "auto";
                    bottom = left = right = "0"; break;
            }
            positionStyle.set({
                position: "absolute",
                top, left, bottom, right,
                marginLeft, marginRight
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

        return out;
    }

    /** DOM element update context */
    protected context: UpdateContext;

    /** Outer element */
    protected element: HTMLElement;
}

// Add logic for focusing and blurring block components
Async.inject(Block, {
    "@focusLiveComponent": function (this: Block) {
        DOM.focus(this);
    },
    "@blurLiveComponent": function (this: Block) {
        DOM.blur(this);
    }
});

// Add style override and apply style sheet
Block.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define(CSS_CLASS, {
    ".~~": {
        cursor: "default",
        lineHeight: "normal",
        display: "block",
        position: "relative",
        textAlign: "start || left",
        margin: "auto",
        transition: "box-shadow 100ms ease"
    }
});
