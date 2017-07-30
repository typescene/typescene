import * as Async from "@typescene/core/Async";
import { Style, Table, TableRow, mapComponentRenderer } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Table";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Table)
export class Renderer<T extends Table<TableRow>> extends BlockRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component, "table");

        // create main DOM elements
        this.thead = document.createElement("thead");
        this.tbody = document.createElement("tbody");
        this.element.appendChild(this.tbody);
        this.context.root = this.tbody;
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // remove (old) header element first
        while (this.element.firstChild !== this.tbody)
            this.element.removeChild(this.element.firstChild!);

        // add header if needed (just render synchronously)
        if (component.header && component.header.columns.length &&
            component.rows.length) {
            // copy ltr/rtl flow direction if set at component level
            if (component.header && component.flowDirection) {
                Async.unobserved(() => {
                    component.header!.flowDirection = component.flowDirection;
                });
            }
            var headerOut = component.header && component.header.out;
            if (headerOut && headerOut.element) {
                var theadTR: HTMLTableRowElement = headerOut.element;
                this.thead.appendChild(theadTR);
                while (theadTR.previousSibling)
                    this.thead.removeChild(theadTR.previousSibling);
                this.element.insertBefore(this.thead, this.tbody);
            }
        }

        // set row index on rendered rows
        var rows = Async.unobserved(() =>
            component.rows.map((r, i) => r && (r.rowIndex = i, r)));

        // add all table rows, if any
        out.updated = this.context.updateAsync(rows, false,
            this.component.renderOptions &&
            this.component.renderOptions.animateListItems);

        return out;
    }

    /** Table head DOM element */
    protected thead: HTMLElement;

    /** Table body DOM element */
    protected tbody: HTMLElement;
}

// Add style override and apply style sheet
Table.addStyleOverride(Style.withClass(CSS_CLASS + " table"));
DOM.Styles.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        display: "table",
        margin: "0",
        borderSpacing: "initial"
    }
});
