import * as Async from "@typescene/async";
import { Component } from "../";
import { Page, PageRenderer } from "../Page";
import { Style } from "../Style";
import { DOM } from "./DOM";
import { DOMUpdater } from "./DOMUpdater";

/** Contains functionality for rendering a page to the DOM; implementation of the PageRenderer class, used by Page to perform platform dependent tasks */
class DOMPageRenderer extends PageRenderer {
    /** DOM update context for the rendered page (memoized) */
    @Async.unobservable_memoize_get
    public get domUpdater() {
        // create the page root element
        var root = DOM.div("__page");
        root.id = DOM.uid;
        root.style.position = "absolute";
        root.style.zIndex = String(DOM.PAGE_OPTIONS.baseZIndex);

        // create the update context for the page root element
        return new DOMUpdater(root);
    }

    /** Render and show the page (within an observable getter) */
    public update() {
        // attach keydown handler to the window
        window.removeEventListener("keydown", this._onKeydown);
        window.addEventListener("keydown", this._onKeydown);

        // reset reference to currently shaded wrapper
        this._shadedWrapper = <any>undefined;

        // render all content into DOM nodes
        var content: any[] = [];
        var components = this.page.content.slice();
        components.forEach(c => {
            // render component synchronously
            var out = c && c.out;
            var element = out && out.element;
            if (element instanceof HTMLElement) {
                // update existing wrapper element, or create one
                var wrapper: HTMLElement = out!.wrapper;
                if (!wrapper || wrapper.className !== "__page_wrapper")
                    wrapper = out!.wrapper = this._createWrapper();
                this._updateWrapper(element, wrapper,
                    c!["displayOptions"], c!.style);

                // add the rendered output instance to the list
                content.push(out);
            }
            else {
                // use a placeholder to stop elements from shifting around
                content.push(document.createComment("placeholder"));
                return;
            }
        });

        // add all content to the page element (using generated wrappers)
        this.domUpdater.updateAsync(content, true).then(() => {
            this.page.Rendered();
            this._moveShadeElement();
        });

        // append the page element to the document body, if needed
        if (!this.domUpdater.root.parentNode)
            document.body.appendChild(this.domUpdater.root);
    }

    /** Remove the rendered page from the screen */
    public remove() {
        // remove the page element itself
        var root = this.domUpdater.root;
        if (root.parentNode) root.parentNode.removeChild(root);

        // remove keydown window event handler
        window.removeEventListener("keydown", this._onKeydown, true);

        // clean up references
        delete this._topOptions;
        delete this._shadedWrapper;
    }

    /** Block all input */
    public disableInput() {
        // unfocus and set flag
        DOM.blur();
        this._isBlocked = true;

        // add blocking event handlers on the window (on capture)
        window.addEventListener("mousedown", this._onEvent, true);
        window.addEventListener("focus", this._onEvent, true);
        window.addEventListener("input", this._onEvent, true);
        window.addEventListener("selectstart", this._onEvent, true);

        // add overlay element to wrap over existing content
        if (!this._blockElement) {
            var blocker = this._blockElement = DOM.div("__page_block");
            blocker.style.position = "fixed";
            blocker.style.top = "0";
            blocker.style.bottom = "0";
            blocker.style.left = "0";
            blocker.style.right = "0";
            blocker.style.cursor = "wait";
            blocker.style.zIndex = "1000000000";
            blocker.style.background = "rgba(0,0,0,0)";  // for IE
        }
        document.body.appendChild(this._blockElement);
    }

    /** Unblock all input */
    public enableInput() {
        this._isBlocked = false;

        // remove overlay element
        if (this._blockElement && this._blockElement.parentNode)
            this._blockElement.parentNode.removeChild(this._blockElement);

        // remove blocking event handlers on the window
        window.removeEventListener("mousedown", this._onEvent, true);
        window.removeEventListener("focus", this._onEvent, true);
        window.removeEventListener("input", this._onEvent, true);
        window.removeEventListener("selectstart", this._onEvent, true);
    }

    /** Scroll to given component */
    public scrollTo(component: Component) {
        component.getRenderedOutputAsync().then(out => {
            var elt = out && out.element;
            if (!elt) return;

            // go through all parent elements to scroll them
            var topOffset = elt.offsetTop;
            var itemHeight = elt.offsetHeight;
            while (elt.offsetParent) {
                var parentElt = <HTMLElement>elt.offsetParent;
                if (parentElt.scrollTop + parentElt.offsetHeight <
                    topOffset + itemHeight) {
                    // scroll down to bottom of selected element
                    parentElt.scrollTop =
                        topOffset + itemHeight - parentElt.offsetHeight;
                }
                if (parentElt.scrollTop > topOffset) {
                    // scroll up to top of selected element
                    parentElt.scrollTop = topOffset;
                }
                topOffset += parentElt.offsetTop - parentElt.scrollTop;
                elt = parentElt;
            }
        });
    }

    /** @internal Create an empty shaded backdrop element */
    private _createShadeElement() {
        var shader = this._shadeElement = DOM.div("__page_backdropshader");
        shader.style.position = "fixed";
        shader.style.left = "0";
        shader.style.right = "0";
        shader.style.top = "0";
        shader.style.bottom = "0";
        shader.style.outline = "0";
        shader.style.zIndex = String(DOM.PAGE_OPTIONS.baseZIndex);
        shader.style.background = DOM.PAGE_OPTIONS.shadeColor;
        shader.style.transition = "opacity " +
            DOM.PAGE_OPTIONS.shadeTransition + "ms ease";
        shader.style.opacity = "0";  // initial
        shader.setAttribute(DOMUpdater.UNMANAGED_FLAG, "true");
        shader.tabIndex = -1;
        return shader;
    }

    /** @internal Move, remove, or insert the modal backdrop shade */
    private _moveShadeElement() {
        var root = this.domUpdater.root;
        if (this._shadedWrapper) {
            if (!this._shadeElement) this._createShadeElement();
            var shadeElement = this._shadeElement!;
            var shadedWrapper = this._shadedWrapper;
            root.insertBefore(shadeElement, this._shadedWrapper);
            setTimeout(() => {
                if (this._shadeElement === shadeElement &&
                    this._shadedWrapper === shadedWrapper)
                    shadeElement.style.opacity =
                        String(DOM.PAGE_OPTIONS.shadeOpacity);
            }, 0);
        }
        else if (this._shadeElement) {
            // transition and remove the currently displayed shade element
            let shader = this._shadeElement;
            shader.style.opacity = "0";
            setTimeout(() => {
                if (shader.parentNode && !this._shadedWrapper)
                    root.removeChild(shader);
            }, DOM.PAGE_OPTIONS.shadeTransition);
        }
    }

    /** @internal Create an empty wrapper element for a component */
    private _createWrapper() {
        var wrapper = DOM.div("__page_wrapper");
        wrapper.style.overflow = "auto";
        wrapper.style.position = "fixed";
        wrapper.style.lineHeight = "0";
        wrapper.style.fontSize = "0";

        // disallow focus if behind modal shader
        wrapper.addEventListener("focus", event => {
            if (this._shadeElement) {
                var cur: Node = wrapper;
                while (cur && cur.nextSibling) {
                    cur = cur.nextSibling;
                    if (cur === this._shadeElement) {
                        event.preventDefault();
                        this._shadeElement.focus();
                        break;
                    }
                }
            }
        }, true);

        // make sure IE also listens to clicks in the transparent area:
        wrapper.style.background = "rgba(0,0,0,0)";
        return wrapper;
    }

    /** @internal Position given DOM element inside of its page wrapper */
    private _updateWrapper(element: HTMLElement, wrapper: HTMLElement,
        options?: Page.DisplayOptions, style?: Style) {
        this._topOptions = options;

        // set z-index to follow content order or stay on top
        wrapper.style.zIndex = String(DOM.PAGE_OPTIONS.baseZIndex +
            ((options && options.stayOnTop) ? 1000 : 0));

        // remember to insert the backdrop shade here if needed
        if (options && options.shade) this._shadedWrapper = wrapper;

        // use .displayOptions to figure out positioning
        var cell: HTMLElement;
        if (options && (options.modal)) {
            // position the element inside a full-screen table cell
            wrapper.style.top = "0";
            wrapper.style.bottom = "0";
            wrapper.style.left = "0";
            wrapper.style.right = "0";

            if (!wrapper.firstChild || wrapper.firstChild === element) {
                // create the layout wrapper cell first
                cell = DOM.div("__page_layoutcell");
                cell.style.display = "table-cell";
                cell.style.boxSizing = "border-box";
                cell.style.position = "relative";
                cell.style.height = "100vh";
                cell.style.width = "100vw";
                cell.style.overflow = "hidden";
                cell.appendChild(element);
                wrapper.appendChild(cell);

                // remove all other elements
                while (cell.previousSibling)
                    wrapper.removeChild(cell.previousSibling);
            }
            else {
                // assume that the first child is the cell
                cell = <HTMLElement>wrapper.firstChild;
                cell.appendChild(element);

                // remove all other elements
                while (element.previousSibling)
                    cell.removeChild(element.previousSibling);
            }

            // align horizontally and vertically
            cell.style.textAlign = options.modalHorzAlign || "center";
            cell.style.verticalAlign = options.modalVertAlign || "middle";
            cell.style.paddingTop = options.modalVertAlign === "top" ?
                (options.alignMargin || "0") :
                (options.modalVertAlign && options.outerMargin || "0");
            cell.style.paddingBottom = options.modalVertAlign === "bottom" ?
                (options.alignMargin || "0") :
                (options.modalVertAlign && options.outerMargin || "0");
            cell.style.paddingLeft = options.modalHorzAlign === "left" ?
                (options.alignMargin || "0") :
                (options.modalHorzAlign && options.outerMargin || "0");
            cell.style.paddingRight = options.modalHorzAlign === "right" ?
                (options.alignMargin || "0") :
                (options.modalHorzAlign && options.outerMargin || "0");
        }
        else {
            // insert element directly into the wrapper, clear other nodes
            wrapper.appendChild(element);
            while (element.previousSibling)
                wrapper.removeChild(element.previousSibling);

            // fix absolutely positioned elements with a "bottom" property
            // to the bottom of the screen ONLY, otherwise to the top ONLY
            var position: string | null, bottom: string | null;
            if (style) {
                position = style.get("position");
                bottom = style.get("bottom");
            }
            else {
                position = element.style.position;
                bottom = element.style.position;
            }
            if (position === "absolute" || position === "fixed") {
                wrapper.style.overflow = "";
                var margin = options && options.alignMargin || "0";
                if (bottom && bottom !== "auto") {
                    wrapper.style.top = "auto";
                    wrapper.style.bottom = margin;
                    wrapper.style.left = margin;
                    wrapper.style.right = margin;
                }
                else {
                    wrapper.style.bottom = "auto";
                    wrapper.style.top = margin;
                    wrapper.style.left = margin;
                    wrapper.style.right = margin;
                }
            }
            else {
                // if positioned relative/static, use full-screen wrapper
                var margin = options && options.outerMargin || "0";
                wrapper.style.top = margin;
                wrapper.style.bottom = margin;
                wrapper.style.left = margin;
                wrapper.style.right = margin;
            }
        }

        // press outside the element invokes onEsc handler
        wrapper.onmousedown = function (event): any {
            if ((options && (typeof options.onEsc === "function")) &&
                (event.target === wrapper || event.target === cell)) {
                options.onEsc.call(undefined);
            }
        }
    }

    /** @internal Bound keydown event handler (on the window) */
    private _onKeydown = (event: KeyboardEvent) => {
        if (this._onEvent(event) !== false) {
            this.KeyDown(event);

            // invoke top component's onEsc handler when escape is pressed
            if (event.keyCode === 27) this.page.handleEsc();
        }
    };

    /** @internal Bound event handler (on the window) */
    private _onEvent = (event: Event): any => {
        if (this._isBlocked) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        }
    };

    /** @internal Current top-most options object (for accessing onEsc) */
    private _topOptions?: Page.DisplayOptions;

    /** @internal Current top-most wrapper with shaded backdrop behind it */
    private _shadedWrapper?: HTMLElement;

    /** @internal DOM element used as a modal shade backdrop */
    private _shadeElement?: HTMLElement;

    /** @internal True when input is currently disabled */
    private _isBlocked?: boolean;

    /** @internal DOM element that covers the entire page */
    private _blockElement?: HTMLElement;
}

// inject this renderer into Page itself
Async.inject(Page, { Renderer: DOMPageRenderer });
