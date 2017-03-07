import * as Async from "@typescene/async";
import { mapComponentRenderer } from "../../../../Components/ComponentRenderer";
import { SelectField } from "../../../../Components/Controls/InputControls/SelectField";
import { Style } from "../../../../Style";
import { DOM } from "../../../DOM";
import { Renderer as ControlRenderer } from "../ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-SelectField";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(SelectField)
export class Renderer<T extends SelectField> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // add label and input classes
        component.style_label.addClass("form-control-label", "control-label");
        component.style_input.addClass("form-control");

        // create label and input elements
        var label = this.label = document.createElement("label");
        var select = this.select = document.createElement("select");
        label.htmlFor = select.id = component.uid + "_select";
        this.element.appendChild(label);
        this.element.appendChild(select);
        select.onchange = () => { component.value = select.value };
        select.onblur = () => { component.value = select.value };

        // add watchers for component properties
        var valueChanged = false;
        this.watch(() => DOM.applyStyleTo(component.style_label, label));
        this.watch(() => DOM.applyStyleTo(component.style_input, select));
        this.watch(() => component.disabled, () => {
            this.select.disabled = component.disabled;
        });
        this.watch(() => component.value, () => {
            var value = component.value;
            if (value === undefined) value = "";
            else value = String(value);
            if (value != select.value) {
                this.select.value = value;
                valueChanged = true;
            }
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        out.liveElement = this.select;
        var component = this.component;

        // remove all options and add current options
        while (this.select.firstChild)
            this.select.removeChild(this.select.firstChild);
        component.options.forEach(option => {
            if (option) {
                var optionElt = document.createElement("option");
                var text = optionElt.textContent = String(option.text);
                optionElt.value = option.value !== undefined ? option.value : text;
                this.select.appendChild(optionElt);
            }
        });

        this.select.name = component.name;

        // show or hide label
        var labelText = this.label.textContent = component.label;
        Async.unobserved(() => {
            component.style_label.hide(!labelText);
        });

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.label.title = component.tooltipText;

        return out;
    }

    /** The label DOM element */
    protected label: HTMLLabelElement;

    /** The select DOM element */
    protected select: HTMLSelectElement;
}

// Add style override and apply style sheet
SelectField.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        // nothing here
    },
    ".~~ > label": {
        font: "inherit"
    },
    ".~~ > input": {
        boxSizing: "border-box",
        width: "100%"
    }
});
