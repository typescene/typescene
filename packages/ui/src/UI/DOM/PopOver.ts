import * as Async from "@typescene/async";
import { ContainerBlock, List, CloseRow, Component } from "../";
import { Container } from "../Components/Containers/Container";
import { Page } from "../Page";
import { PopOver } from "../PopOver";
import { Screen } from "../Screen";
import { Style } from "../Style";
import { DOMBlock } from "./DOMBlock";

/** Display popover below given component */
PopOver.displayBelow = function (ref: Component, container: Container, options: PopOver.Options) {
    var out = ref.getLastRenderedOutput();
    if (out && out.element) {
        var r = (<HTMLElement>out.element).getBoundingClientRect();
        new DOMPopOverComponent(container, "bottom", options)
            .displayAt((r.left + r.right) >> 1, r.bottom + 8);
    }
};

/** Display popover above given component */
PopOver.displayAbove = function (ref: Component, container: Container, options: PopOver.Options) {
    var out = ref.getLastRenderedOutput();
    if (out && out.element) {
        var r = (<HTMLElement>out.element).getBoundingClientRect();
        new DOMPopOverComponent(container, "top", options)
            .displayAt((r.left + r.right) >> 1, r.top - 8);
    }
};

/** Remove current menu */
PopOver.dismiss = function () {
    var page = Page.getCurrentPage();
    page && page.getComponentsByType(DOMPopOverComponent)
        .forEach(c => Screen.remove(c));
};

/** DOM popover element */
class DOMPopOverComponent extends Container {
    /** Create DOM popover component */
    constructor(container: Container, pos: "top" | "bottom", options?: PopOver.Options) {
        super();
        this._pos = pos;

        // create popover arrow
        // TODO: REVISIT THIS... BOOTSTRAP 4 IS NOT COMPATIBLE
        var arrow: DOMBlock | undefined;
        if (!options || !options.hideArrow) {
            arrow = this._arrow = new DOMBlock();
            var arrowOverride = Style.withClass("arrow popover-arrow")
                .removeClass("UI-Block");
            arrow.style.override(arrowOverride);
        }

        // create title content block if any
        var titleContent: CloseRow | undefined;
        if (options && options.title) {
            titleContent = new CloseRow();
            titleContent.initializeWith({ content: [<any>options.title] });
            titleContent.style.addClass("popover-title")
                .removeClass("UI-Block");
        }

        // create content block to be populated on display
        var content = new ContainerBlock(container);
        content.style.addClass("popover-content");
        content.style.set({ margin: "0", padding: "0" });
        this.width = <any>Async.observe(() => container.width);

        // add all elements to list
        var list = this._list = new List([arrow, titleContent, content]);
        list.style.addClass("popover " + pos, "popover-" + pos, "show")
            .set("overflow", "visible");
        list.animations = { appear: options && options.animation };
        this.content.push(list);

        // set display options to force table wrapper
        this.displayOptions = {
            modal: true,
            onEsc: () => { Screen.remove(this) }
        };
    }

    /** Display popover element around given horizontal position */
    public displayAt(x: number, y: number) {
        // remove if already displayed
        Screen.remove(this);

        // move to horizontal center, then slide left/right
        var rightAlign = (x > window.innerWidth >> 1);
        this.style.override({
            position: "absolute",
            height: "auto",
            top: (this._pos === "top") ? "auto" : (y + "px"),
            bottom: (this._pos === "top") ?
                ((window.innerHeight - y) + "px") : "auto",
            left: rightAlign ? "auto" : (x + "px"),
            right: rightAlign ?
                ((window.innerWidth - x) + "px") : "auto",
            overflow: "visible",
            transform: rightAlign ?
                "translateX(50%)" : "translateX(-50%)",
            maxWidth: Async.observe(() => this.width)
        });
        Screen.display(this);

        // check if popover is not off screen
        var checkPos = () => {
            // if pushed too far to the side, move to the edge
            var out = this.getLastRenderedOutput();
            if (!out) return;
            var rect = (<HTMLElement>out.element).getBoundingClientRect();
            if (!rect || !rect.width) return;

            if (rect.right > window.innerWidth) {
                this.style.override({ right: "0", transform: "" });
                this._arrow && this._arrow.style.set({
                    left: "auto",
                    right: (window.innerWidth - x) + "px"
                    // set margin????
                });
            }
            else if (rect.left < 0) {
                this.style.override({ left: "0", transform: "" });
                this._arrow && this._arrow.style.set({
                    right: "auto",
                    left: x + "px"
                });
            }

            // if pushed too far down or up, move to the edge (remove arrow)
            if (rect.bottom > window.innerHeight) {
                this._arrow && this._arrow.style.hide();
                this.style.override({ bottom: "0", top: "auto" });
            }
            else if (rect.top < 0) {
                this._arrow && this._arrow.style.hide();
                this.style.override({ top: "0", bottom: "auto" });
            }
        };
        window.setTimeout(checkPos, 10);
        window.setTimeout(checkPos, 50);
        window.setTimeout(checkPos, 100);
    }

    private _list?: List<any>;
    private _arrow?: DOMBlock;
    private _pos: "top" | "bottom";
}
