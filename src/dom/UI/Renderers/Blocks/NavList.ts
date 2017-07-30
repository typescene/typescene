import * as Async from "@typescene/core/Async";
import { Style, NavList, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as LabelRenderer } from "../Controls/Label";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-NavList";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(NavList)
export class Renderer<T extends NavList> extends BlockRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component, "nav");

        // create the UL wrapper
        this._ul = document.createElement("ul");
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // set UL class name depending on nav type
        var ul = this._ul;
        var className = "nav ";
        if (component.justified) className += "nav-justified ";
        switch (component.type) {
            case NavList.Type.Tabs:
                className += "nav-tabs";
                break;
            case NavList.Type.Pills:
                className += "nav-pills";
                break;
            case NavList.Type.StackedPills:
                className += "nav-pills nav-stacked";
                break;
        }
        ul.className = className;

        // create or reuse LI nodes
        var cur = ul.firstChild;
        var selectedIndex = component.selectedIndex;
        component.navItems.forEach((item, index) => {
            if (!item) return;
            if (!cur) {
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.href = "#";
                li.appendChild(a);
                li.onclick = event => {
                    component.activate(index);
                    event.preventDefault();
                    return false;
                };
                ul.appendChild(cur = li);
            }
            LabelRenderer.renderInto(cur.firstChild!,
                item.icon, component.remGutter, item.label, item.badge);
            var isSelected = (index === selectedIndex);
            (<HTMLElement>cur).className = isSelected ?
                "nav-item active" : "nav-item";
            (<HTMLElement>cur.firstChild).className = isSelected ?
                "nav-link active" : "nav-link";
            cur = cur.nextSibling;
        });

        // remove additional existing nodes
        while (cur) {
            var next = cur.nextSibling;
            ul.removeChild(cur);
            cur = next;
        }

        // update with UL, and container block if needed
        out.updated = this.context.updateAsync(
            [<any>ul].concat(component.getChildren()));

        return out;
    }

    /** UL (".nav") element */
    private _ul: HTMLElement;
}

// inject simple URL-based activation functions
Async.inject(NavList.Activation, {
    activate: (target: any) => {
        // set location to given target directly (URL, path or hash)
        if (typeof target === "string")
            window.location.href = target;
    },
    isActive: (target: any) => {
        if (typeof target === "string") {
            target = target.replace(/\/$/, "");
            if (target[0] !== "#") {
                // compare target to partial path name (without host and hash)
                var path = String(document.location.pathname)
                    .replace(/#.*/, "");
                if (path === target ||
                    path.slice(0, target.length + 1) === target + "/")
                    return true;
            }
            else {
                // compare target to partial hash
                target = target.slice(1);
                var hash = String(document.location.hash || "")
                    .replace(/^#/, "");
                if (hash === target ||
                    hash.slice(0, target.length + 1) === target + "/")
                    return true;
            }
        }
        return false;
    }
});

// Add style override
NavList.addStyleOverride(Style.withClass(CSS_CLASS));
