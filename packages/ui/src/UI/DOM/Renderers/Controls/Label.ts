import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { Label, WideLabel, Paragraph, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from "../../../Components/Controls/Label";
import { TextLabelFactory } from "../../../Components/TextLabelFactory";
import { Style } from "../../../Style";
import { DOM } from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Label";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Label)
export class Renderer<T extends Label> extends ControlRenderer<T> {
    /** Helper method to replace contents of given node with icon, label, and badge, if any; returns node itself */
    public static renderInto(node: Node, icon?: string, remGutter?: number,
        label?: string | TextLabelFactory, badge?: string | TextLabelFactory,
        append?: boolean, iconRight?: boolean) {
        if (!append) while (node.firstChild) node.removeChild(node.firstChild);
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
                        iconElement.style[prop] = (val[0] === '"') ?
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
            if (icon && !(remGutter! > 0)) labelText = " " + labelText;
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
            component.text, component.badge);

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.element.title = component.tooltipText;

        return out;
    }
}
@mapComponentRenderer(Paragraph)
class ParagraphRenderer extends Renderer<Paragraph> {
    constructor(component: Paragraph) { super(component, "p") }
}
@mapComponentRenderer(Heading1)
class H1Renderer extends Renderer<Heading1> {
    constructor(component: Heading1) { super(component, "h1") }
}
@mapComponentRenderer(Heading2)
default class H2Renderer extends Renderer<Heading2> {
    constructor(component: Heading2) { super(component, "h2") }
}
@mapComponentRenderer(Heading3)
class H3Renderer extends Renderer<Heading3> {
    constructor(component: Heading3) { super(component, "h3") }
}
@mapComponentRenderer(Heading4)
class H4Renderer extends Renderer<Heading4> {
    constructor(component: Heading4) { super(component, "h4") }
}
@mapComponentRenderer(Heading5)
class H5Renderer extends Renderer<Heading5> {
    constructor(component: Heading5) { super(component, "h5") }
}
@mapComponentRenderer(Heading6)
class H6Renderer extends Renderer<Heading6> {
    constructor(component: Heading6) { super(component, "h6") }
}

// Add style override and apply style sheet
Label.addStyleOverride(Style.withClass(CSS_CLASS));
WideLabel.addStyleOverride(Style.withClass(CSS_CLASS + " wide"));
DOM.CSS.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        cursor: "inherit",
        overflow: "hidden"
    },
    ".~~.wide": {
        maxWidth: "1px",
        textOverflow: "ellipsis"
    },
    "p.~~": {
        lineHeight: DOM.CSS.variables["Paragraph.lineHeight"]
    }
});
