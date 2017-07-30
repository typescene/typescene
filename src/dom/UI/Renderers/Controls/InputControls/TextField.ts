import * as Async from "@typescene/core/Async";
import { TextField, Style, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../../DOM";
import { Renderer as ControlRenderer } from "../ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-TextField";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(TextField)
export class Renderer<T extends TextField> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // add label and input classes
        component.style_label.addClass("form-control-label", "control-label");
        component.style_input.addClass("form-control");

        // create label and input elements
        var label = this.label = document.createElement("label");
        var input = this.input = document.createElement(
            component.textareaLines > 0 ? "textarea" : "input");
        label.htmlFor = input.id = component.uid + "_input";
        this.element.appendChild(label);
        this.element.appendChild(input);
        input.onchange = () => { component.value = input.value };
        input.onblur = () => { component.value = input.value };
        input.oninput = () => {
            if (component.immediateValueUpdate)
                component.value = input.value;
        };
        input.onkeydown = event => {
            if (event.keyCode == 13)
                component.value = input.value;
        };

        // add watchers for component properties
        var valueChanged = false;
        this.watch(() => DOM.applyStyleTo(component.style_label, label));
        this.watch(() => DOM.applyStyleTo(component.style_input, input));
        this.watch(() => component.disabled, () => {
            this.input.disabled = component.disabled;
        });
        this.watch(() => component.value, () => {
            var value = component.value;
            if (value != input.value) {
                this.input.value = value;
                valueChanged = true;
            }
        });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        out.liveElement = this.input;
        var component = this.component;

        // set properties
        this.input.name = component.name;
        this.input.placeholder = component.placeholderText;
        if (component.textareaLines) {
            // set number of rows
            (<HTMLTextAreaElement>this.input).rows = component.textareaLines;
        }
        else {
            // set specific text input type
            this.input.setAttribute("type",
                TextField.Type[component.type].toLowerCase());
        }

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

    /** The input/textarea DOM element */
    protected input: HTMLInputElement | HTMLTextAreaElement;
}

// inject text selection function
Async.inject(TextField, {
    selectText: function (this: TextField, start = 0, end?: number) {
        var out = this.getLastRenderedOutput();
        if (!out) {
            // select only when rendered
            this.Rendered.connect(() => this.selectText(start, end));
            return;
        }

        // find the input element and focus it
        var input: HTMLInputElement = out.liveElement;
        input.focus();
        if (!end && end !== 0) {
            // select all the way through to the end if end is undefined
            end = input.value.length;
        }

        // use whatever method is available to select text
        if ((<any>input).createTextRange) {
            var range = (<any>input).createTextRange();
            range.collapse(true);
            range.moveStart('character', start);
            range.moveEnd('character', end);
            range.select();
        }
        else if (input.setSelectionRange) {
            input.setSelectionRange(start, end);
        }
        else if (input.selectionStart) {
            input.selectionStart = start;
            input.selectionEnd = end;
        }

        return this;
    }
});

// Add style override and apply style sheet
TextField.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.Styles.define("UI-Control " + CSS_CLASS, {
    ".~~": {
        // nothing here
    },
    ".~~ > input": {
        width: "100%"
    },
    ".~~ > textarea": {
        width: "100%"
    }
});
