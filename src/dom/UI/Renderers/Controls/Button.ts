import * as Async from "@typescene/core/Async";
import { Button, PrimaryButton, ToggleButton, LinkButton, TextButton, RoundButton, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";
import { Renderer as LabelRenderer } from "./Label";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Button";

/** Overrides for predefined button styles */
const linkBtnOverride = Style.withClass("btn-link")
    .removeClass("btn-secondary", "btn-default");
const textBtnOverride = Style.withClass("btn-text-only")
    .removeClass("btn-secondary", "btn-default");

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Button)
export class Renderer<T extends Button> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        if (component instanceof LinkButton) {
            // create link element
            var a = this.button = document.createElement("a");
            a.href = "#";
            a.onclick = e => e.preventDefault();
            this.element.appendChild(a);
            this.watch(() => component!.target, target => {
                a.href = (typeof target === "string") ? target : "#";
            });
        }
        else {
            // create button element
            var button = this.button = document.createElement("button");
            button.type = "button";
            this.element.appendChild(button);
            this.watch(() => component!.disabled, disabled => {
                button.disabled = disabled;
            });
        }

        // override btn styles
        component.style_button.addClass("btn");
        if (component instanceof LinkButton)
            component.style_button.override(linkBtnOverride);
        if (component instanceof TextButton)
            component.style_button.override(textBtnOverride);

        // add watchers for component properties
        this.watch(() => DOM.applyStyleTo(component.style_button, this.button));
        this.watch(() => component.primary, primary => {
            if (primary) {
                component.style_button.addClass("btn-primary");
                component.style_button.removeClass(
                    "btn-secondary", "btn-default");
            }
            else {
                component.style_button.removeClass("btn-primary");
                component.style_button.addClass(
                    "btn-secondary", "btn-default");
            }
        });
        this.watch(() => component.selected, selected => {
            if (selected) component.style_button.addClass("active");
            else component.style_button.removeClass("active");
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        out.liveElement = this.button;
        var component = this.component;

        // render text into DOM element
        LabelRenderer.renderInto(this.button,
            component.icon,
            component.icon ? component.remGutter : 0,
            component.label, component.badge);
        if (component.iconAfter) {
            // also append iconAfter
            LabelRenderer.renderInto(this.button,
                component.iconAfter,
                component.remGutter,
                "", "", true, true);
        }

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.button.title = component.tooltipText;

        return out;
    }

    /** The button DOM element */
    protected button: HTMLButtonElement | HTMLAnchorElement;
}

// inject simple URL-based activation function
Async.inject(Button.Activation, {
    activate: (target: any) => {
        // set location to given target directly (URL, path or hash)
        if (typeof target === "string")
            window.location.href = target;
    }
});

// Add style override and apply style sheet
Button.addStyleOverride(Style.withClass(CSS_CLASS));
PrimaryButton.addStyleOverride(Style.withClass(CSS_CLASS + " UI-PrimaryButton"));
ToggleButton.addStyleOverride(Style.withClass(CSS_CLASS + " UI-ToggleButton"));
LinkButton.addStyleOverride(Style.withClass(CSS_CLASS + " UI-LinkButton"));
TextButton.addStyleOverride(Style.withClass(CSS_CLASS + " UI-TextButton"));
RoundButton.addStyleOverride(Style.withClass(CSS_CLASS + " UI-RoundButton"));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        minWidth: "1px"
    },
    ".~~ > button": {
        width: "100%",
        whiteSpace: "pre"
    },
    ".~~.UI-TextButton > button": {
        border: "0",
        boxShadow: "none",
        outline: "0",
        background: "transparent",
        padding: "0",
        margin: "0",
        width: "auto",
        minWidth: "0",
        fontSize: "inherit",
        fontWeight: "inherit",
        fontFamily: "inherit",
        fontStyle: "inherit",
        height: "auto",
        lineHeight: "normal",
        verticalAlign: "baseline",
        color: "inherit"
    },
    ".~~.UI-RoundButton > button": {
        padding: "0",
        border: "0",
        outline: "0",
        borderRadius: "50%",
        boxShadow: "none",
        overflow: "hidden",
        minWidth: "2.2em",
        maxWidth: "2.2em",
        height: "2.2em"
    }
});
