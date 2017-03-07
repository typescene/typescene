import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { Block } from "../../../Components/Blocks/Block";
import { Component } from "../../../Components/Component";
import { ComponentRenderer, mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { DOM } from "../../DOM";
import { DOMUpdater } from "../../DOMUpdater";

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
        this.context = new DOMUpdater(this.element);

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
        this.watch(() => component.overlayPosition, pos => {
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

        return out;
    }

    /** DOM element update context */
    protected context: DOMUpdater;

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
DOM.CSS.define(CSS_CLASS, {
    ".~~": {
        cursor: "default",
        lineHeight: "normal",
        display: "block",
        position: "relative",
        boxSizing: "border-box",
        textAlign: "left",
        margin: "auto",
        transition: "box-shadow 100ms ease"
    },
    ".__page_wrapper > .~~": {
        fontSize: DOM.CSS.variables["baseFontSize"]
    }
});
