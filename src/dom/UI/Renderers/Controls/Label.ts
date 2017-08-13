import * as Async from "@typescene/core/Async";
import { Label, WideLabel, Paragraph, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, TextLabelFactory, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Label";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Label)
export class Renderer<T extends Label> extends ControlRenderer<T> {
    /** Helper method to replace contents of given node with icon, label, and badge, if any; returns node itself */
    public static renderInto(node: Node, icon?: string, remGutter?: number,
        label?: string | TextLabelFactory, badge?: string | TextLabelFactory,
        append?: boolean, iconRight?: boolean,
        smallBefore?: string | TextLabelFactory,
        smallAfter?: string | TextLabelFactory) {
        if (!append) while (node.firstChild) node.removeChild(node.firstChild);
        var beforeLabelText = smallBefore !== undefined && String(smallBefore);
        if (beforeLabelText) {
            var beforeLabelElement = document.createElement("small");
            beforeLabelElement.textContent = beforeLabelText;
            node.appendChild(beforeLabelElement);
        }
        if (icon || remGutter! > 0) {
            var iconElement = document.createElement("icon");
            if (remGutter! >= 0) {
                iconElement.style.display = "inline-block";
                iconElement.style.textAlign = "center";
                iconElement.style.minWidth = remGutter + "rem";
            }
            if (icon) {
                var content = "";
                icon = icon.replace(/\s+([\w-]+)\s*=\s*(\"[^\"]*\"|[^\s]+)/g,
                    (s: string, prop: string, val: string) => {
                        prop = prop.replace(/-\w/g, s => s[1].toUpperCase());
                        (<any>iconElement.style)[prop] = (val[0] === '"') ?
                            JSON.parse(val) : val;
                        return "";
                    })
                    .replace(/\:(?:\"[^\"]*\"|[^\s]+)/, (s: string) => {
                        s = s.slice(1);
                        content = (s[0] === '"') ? JSON.parse(s) : s;
                        return "";
                    });
                var prefix = icon.split("-", 1)[0];
                if (prefix !== icon) icon = prefix + " " + icon;
                iconElement.className = icon;
                iconElement.textContent = content;
            }
            node.appendChild(iconElement);
        }
        var labelText = label !== undefined && String(label);
        if (labelText) {
            if (icon && !(remGutter! > 0)) labelText = "  " + labelText;
            var labelElement = document.createElement("span");
            labelElement.textContent = labelText;
            node.appendChild(labelElement);
        }
        var badgeText = badge !== undefined && String(badge);
        if (badgeText) {
            var badgeElement = document.createElement("badge");
            badgeElement.className = "badge badge-default tag tag-default";
            badgeElement.style.marginLeft = ".5rem";
            badgeElement.textContent = badgeText;
            node.appendChild(badgeElement);
        }
        var afterLabelText = smallAfter !== undefined && String(smallAfter);
        if (afterLabelText) {
            var afterLabelElement = document.createElement("small");
            afterLabelElement.textContent = afterLabelText;
            node.appendChild(afterLabelElement);
        }
        if (!node.firstChild) {
            // add zero-width space to make sure label doesn't collapse to 0-width
            var zeroWidthElement = document.createElement("span");
            zeroWidthElement.textContent = "\u200B";
            node.appendChild(zeroWidthElement);
        }
        return node;
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // render text into DOM element
        Renderer.renderInto(this.element,
            component.icon, component.remGutter,
            component.text, component.badge,
            false, false,
            component.textBefore, component.textAfter);

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.element.title = component.tooltipText;

        return out;
    }
}
/** @internal */
@mapComponentRenderer(Paragraph)
export class ParagraphRenderer extends Renderer<Paragraph> {
    constructor(component: Paragraph) { super(component, "p") }
}
/** @internal */
@mapComponentRenderer(Heading1)
export class H1Renderer extends Renderer<Heading1> {
    constructor(component: Heading1) { super(component, "h1") }
}
/** @internal */
@mapComponentRenderer(Heading2)
export class H2Renderer extends Renderer<Heading2> {
    constructor(component: Heading2) { super(component, "h2") }
}
/** @internal */
@mapComponentRenderer(Heading3)
export class H3Renderer extends Renderer<Heading3> {
    constructor(component: Heading3) { super(component, "h3") }
}
/** @internal */
@mapComponentRenderer(Heading4)
export class H4Renderer extends Renderer<Heading4> {
    constructor(component: Heading4) { super(component, "h4") }
}
/** @internal */
@mapComponentRenderer(Heading5)
export class H5Renderer extends Renderer<Heading5> {
    constructor(component: Heading5) { super(component, "h5") }
}
/** @internal */
@mapComponentRenderer(Heading6)
export class H6Renderer extends Renderer<Heading6> {
    constructor(component: Heading6) { super(component, "h6") }
}

// Add style override and apply style sheet
Label.addStyleOverride(Style.withClass(CSS_CLASS));
WideLabel.addStyleOverride(Style.withClass(CSS_CLASS + " wide")
    .set("maxWidth", "1px"));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        cursor: "inherit",
        overflow: "hidden"
    },
    ".~~.wide": {
        textOverflow: "ellipsis"
    },
    ".~~ small": {
        display: "block",
        color: Async.observe(() => DOM.Styles.color.textFaded)
    },
    "p.~~": {
        lineHeight: Async.observe(() => DOM.Styles.size.paragraphLineHeight)
    }
});
