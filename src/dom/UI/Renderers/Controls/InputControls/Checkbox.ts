import { Checkbox, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../../DOM";
import { Renderer as ControlRenderer } from "../ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-CheckBox";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Checkbox)
export class Renderer<T extends Checkbox> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // add label and input classes
        component.style_label.addClass("form-check-label");
        component.style_input.addClass("form-check-input");

        // create label, input, and text elements
        var label = this.label = document.createElement("label");
        var input = this.input = document.createElement("input");
        var span = this.span = document.createElement("span");
        label.appendChild(input);
        label.appendChild(span);
        this.element.appendChild(label);
        label.onclick = () => {
            // send event to unchecked radios as well
            var radios = document.querySelectorAll(
                "input[type=\"radio\"][name=\"" + component.name + "\"]");
            var evt = document.createEvent("Events");
            evt.initEvent("change", true, false);
            for (var radio of <any>radios)
                radio.dispatchEvent(evt);
        };
        input.onchange = () => { component.checked = input.checked };
        input.onblur = () => { component.checked = input.checked };

        // add watchers for component properties
        this.watch(() => DOM.applyStyleTo(component.style_label, label));
        this.watch(() => DOM.applyStyleTo(component.style_input, input));
        this.watch(() => DOM.applyStyleTo(component.style_text, span));
        this.watch(() => component.disabled, () => {
            this.input.disabled = component.disabled;
        });
        this.watch(() => component.type, type => {
            this.input.type = type ? "radio" : "checkbox";
            if (type)
                component.style.removeClass("checkbox").addClass("radio");
            else
                component.style.removeClass("radio").addClass("checkbox");
        });
        this.watch(() => component.checked, () => {
            this.input.checked = !!component.checked;
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        out.liveElement = this.input;
        var component = this.component;

        // set properties
        this.label.appendChild(this.input);
        this.input.value = component.value;
        this.input.name = component.name;

        // render text into DOM element
        var text = this.span.textContent = component.label;
        if (!text) {
            // move input inside of span, along with zero-width space
            // to make sure the label has the height of 1 line at minimum
            this.span.innerHTML = "&#8203;";
            this.span.insertBefore(this.input, this.span.firstChild);
        }
        this.label.appendChild(this.span);

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.label.title = component.tooltipText;

        return out;
    }

    /** The label DOM element */
    protected label: HTMLLabelElement;

    /** The input DOM element */
    protected input: HTMLInputElement;

    /** The text DOM element */
    protected span: HTMLSpanElement;
}

// Add style override and apply style sheet
Checkbox.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        // nothing here
    },
    ".~~ > label": {
        margin: "0",
        paddingTop: "0", paddingBottom: "0",
        display: "inline"
    }
});
