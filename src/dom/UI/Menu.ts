import * as Async from "@typescene/core/Async";
import { Page, Screen, Component, PointerEvent, Menu, Style } from "@typescene/core/UI";
import * as DOM from "./DOM";
import { DOMBlock } from "./DOM/DOMBlock";
import { Renderer as LabelRenderer } from "./Renderers/Controls/Label";

/** Mouse hover timeout after which to show/hide sub menu */
const HOVER_TIMEOUT = 200;

/** Current hover timeout ID */
var _hoverTimer: number | undefined;

/** Item height, in pixels, of one menu item; used for calculating whether the menu fits on screen vertically, before displaying the menu below or above the mouse cursor or control element */
var _itemHeight = 28;

/** Display a modal context menu */
Menu.displayContextMenu = function (options: Menu.Option[], event: PointerEvent):
    PromiseLike<string | number> {
    return new DOMMenuComponent(options).display(event.clientX!, event.clientY!);
};

/** Display a modal dropdown menu */
Menu.displayDropdown = function (options: Menu.Option[], ref: Component):
    PromiseLike<string | number> {
    var out = ref.getLastRenderedOutput();
    if (out && out.element) {
        var r = (<HTMLElement>out.element).getBoundingClientRect();
        return new DOMMenuComponent(options)
            .display(r.right, r.bottom, true, r.bottom - r.top);
    }
    return Async.Promise.reject(new Error());
};

/** Remove current menu */
Menu.dismiss = function () {
    var page = Page.getCurrentPage();
    page && page.getComponentsByType(DOMMenuComponent)
        .forEach(c => Screen.remove(c));
};

/** Component that contains a menu DOM element */
class DOMMenuComponent extends DOMBlock {
    /** Create DOM dropdown menu */
    constructor(options: Menu.Option[] = []) {
        super();
        this.options = options;

        // create UL node
        var menu = document.createElement("ul");
        menu.style.cssFloat = "none";
        menu.style.position = "static";
        menu.style.boxShadow = "none";
        menu.style.margin = "0";
        menu.className = "dropdown-menu show";  // v3
        this._menu = menu;
        this.nodes.push(menu);

        // set display options
        this.displayOptions = {
            modal: true,  // trigger table wrapper
            onEsc: () => {
                // onEsc: reject promise and remove menu
                Screen.remove(this);
                this._rejector(new Error());
            }
        };

        // add mouseout handler to stop sub menus from showing
        menu.onmouseout = event => {
            if (_hoverTimer) window.clearTimeout(_hoverTimer);
            _hoverTimer = undefined;
            if (event.target === menu && !this._subMenuShown) {
                _hoverTimer = window.setTimeout(() => {
                    this._clearSubMenus();
                    _hoverTimer = undefined;
                }, HOVER_TIMEOUT)
            }
        };
    }

    /** Menu options for this (sub) menu */
    public options: Menu.Option[];

    /** Set to true to force this menu to be displayed on the left side */
    public forceLeft?: boolean;

    /** Display this menu at the given location on screen, either below or above; vert/horz push define the amount to displace the menu if showing on top/left; appended as child of given DOM node, or displayed on screen in its own layer */
    public display(x: number, y: number, force?: boolean,
        vertPush?: number, horizPush?: number, parent?: Node) {
        this._isBase = !parent;
        while (this._menu.firstChild)
            this._menu.removeChild(this._menu.firstChild);
        var result = new Async.Promise<string | number>((resolve, reject) => {
            this._resolver = resolve;
            this._rejector = reject;
        });

        // set position around given x, y + displacement coordinates
        this._setPosition(x, y, force, vertPush, horizPush);

        // add options from array
        var hasIcon = this.options.some(option => option && !!option.icon);
        this.options.forEach((option, i) => {
            if (!option) return;

            // create list item element with divider or option link
            var li = document.createElement("li");
            this._menu.appendChild(li);
            if (option.disabled) li.className = "disabled";
            if (option.divider) {
                // create a divider
                li.className = "divider dropdown-divider";
            }
            else {
                // create a text option, add click handler
                var a = document.createElement("a");
                a.className = "dropdown-item";
                a.href = "#";
                if (option.disabled) {
                    a.className += " disabled";
                    a.style.cursor = "default";
                    a.onclick = event => { event.preventDefault() };
                }
                else {
                    a.tabIndex = 0;
                    a.style.cursor = "pointer";
                    if (!option.subMenu) this._addLinkClickHandler(a, i);
                }
                this._addLinkHoverHandler(a, i);
                li.appendChild(a);

                // render text into link
                var iw = hasIcon ? 1.5 : 0;
                LabelRenderer.renderInto(a, option.icon, iw, option.label);
                if (hasIcon) a.style.paddingLeft = ".5rem";

                // render far side icon
                if (option.sideIcon) {
                    var r = document.createElement("span");
                    r.className = "bidi_floatEnd";
                    LabelRenderer.renderInto(r, option.sideIcon);
                    a.appendChild(r);
                }
            }
        });

        // update element height estimate after display
        this.Rendered.connectOnce(out => {
            Async.sleep(30).then(() => {
                var elt: HTMLElement = out.element;
                if (elt) {
                    var max = 0;
                    for (var li of <any>elt.querySelectorAll("li"))
                        max = Math.max(max, li.offsetHeight);
                    if (max && _itemHeight !== max) {
                        _itemHeight = max;
                        this._setPosition(x, y, force, vertPush, horizPush);
                    }
                }
            });
        });

        // add menu as a child or display as new modal layer
        var out = this.out;
        if (parent && out) parent.appendChild(out.element);
        else Screen.displayAsync(this);

        return result;
    }

    private _setPosition(x: number, y: number, forceLeft?: boolean,
        vertPush?: number, horizPush?: number) {
        // position menu on left or right of given coordinates
        if (x + 200 < window.innerWidth && (!forceLeft || x < 200)) {
            this.style.set({ left: x + "px", right: "auto" });
        }
        else {
            var right = (window.innerWidth - x + (horizPush || 0)) + "px";
            this.style.set({ left: "auto", right });
        }

        // position menu on top or bottom of given coordinates
        if (y + this.options.length * _itemHeight + 10 < window.innerHeight) {
            this.style.set({ top: y + "px", bottom: "auto" });
        }
        else {
            var bottom = (window.innerHeight - y + (vertPush || 0)) + "px";
            this.style.set({ top: "auto", bottom });
            var checkTop = () => {
                // if pushed above window top, move to very top
                if (this._menu.offsetTop < 0)
                    this.style.set({ top: "0", bottom: "auto" });
            };
            window.setTimeout(checkTop, 10);
            window.setTimeout(checkTop, 50);
            window.setTimeout(checkTop, 100);
        }
    }

    private _clearSubMenus() {
        this._subMenuShown = undefined;
        var out = this.getLastRenderedOutput();
        var elt: HTMLElement = out && out.element;
        while (elt && elt.nextSibling)
            elt.parentNode!.removeChild(elt.nextSibling);
    }

    private _addLinkClickHandler(elt: HTMLAnchorElement, i: number) {
        var option = this.options[i];
        elt.onclick = event => {
            event.preventDefault();
            if (this._isBase) Screen.remove(this);
            this._resolver(option.key || (i + 1));
        }
    }

    private _addLinkHoverHandler(elt: HTMLAnchorElement, i: number) {
        var option = this.options[i];
        elt.onmouseover = () => {
            // clear timer to show/hide (other) sub menu
            if (_hoverTimer) {
                window.clearTimeout(_hoverTimer);
                _hoverTimer = undefined;
            }

            // set timer to show current sub menu, if not already shown
            if (this._subMenuShown !== option) {
                _hoverTimer = window.setTimeout(() => {
                    this._clearSubMenus();
                    _hoverTimer = undefined;
                    if (!option.subMenu) return;
                    this._subMenuShown = option;

                    // create and display sub menu
                    var r = (<Element>elt.parentNode).getBoundingClientRect();
                    var out = this.getLastRenderedOutput();
                    var parentNode = out && out.element.parentNode;
                    var p = new DOMMenuComponent(option.subMenu)
                        .display(r.right - 5, r.top, false,
                        -_itemHeight, r.right - r.left - 10,
                        parentNode);
                    p.then(choice => {
                        if (this._isBase) Screen.remove(this);
                        if (typeof choice == "number" && choice > 0) {
                            var base = 100;
                            while (base <= choice) base *= 100;
                            choice = (i + 1) * base + <number>choice;
                        }
                        this._resolver(choice);
                    });
                }, HOVER_TIMEOUT);
            }
        };
    }

    private _subMenuShown?: Menu.Option;
    private _resolver: (choice: string | number) => void;
    private _rejector: (e: Error) => void;

    private _menu: HTMLElement;
    private _isBase: boolean;
}

// Add style override and apply style sheet
DOMMenuComponent.addStyleOverride(Style.withClass("UI-Menu dropdown open")
    .addShadowEffect(.75));
DOM.Styles.define("UI-Block UI-Menu", {
    ".~~": {
        position: "absolute",
        fontSize: Async.observe(() => DOM.Styles.size.text),
        lineHeight: "normal"
    }
});
