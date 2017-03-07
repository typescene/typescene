import { Component } from "../../../Components/Component";
import { ControlElement } from "../../../Components/Controls/ControlElement";
import { Style } from "../../../Style";
import { TableRow, TableHeader} from "../../../Components/Blocks/TableRow";
import { mapComponentRenderer, ComponentRenderer } from "../../../Components/ComponentRenderer";
import { DOM } from "../../DOM";
import { Renderer as BlockRenderer } from "./Block";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-TableRow";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(TableRow)
export class Renderer<T extends TableRow> extends BlockRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component, "tr");
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        var component = this.component;

        // add all columns (using renderer wrappers), if any
        var columns: any[] = [];
        var isHeader = (component instanceof TableHeader);
        component.columns.forEach((col, i) => {
            var cell: HTMLElement;

            // check column content type: component or scalar
            if (col instanceof Component) {
                // render component synchronously, check wrapper
                var out: ComponentRenderer.Output<any, HTMLElement> = col.out!;
                if (!out) {
                    columns.push(undefined);
                    return;
                }
                cell = out.wrapper!;
                var nodeName = String(cell && cell.nodeName).toLowerCase();
                if (isHeader ? (nodeName !== "td") : (nodeName !== "th")) {
                    // create (double) wrapper around component
                    cell = document.createElement(isHeader ? "th" : "td");
                    cell.style.verticalAlign = "baseline";
                    cell.style.lineHeight = "normal";
                    var div = document.createElement("div");
                    div.style.display = "inline-block";
                    div.style.width = "100%";
                    div.appendChild(out.element);
                    cell.appendChild(div);
                    out.wrapper = cell;
                }

                // add column output (with wrapper) to content list
                columns.push(out);
            }
            else {
                // create cell with text content
                cell = document.createElement(isHeader ? "th" : "td");
                cell.textContent = (col || <any>col === 0) ? String(col) : "";
                cell.style.whiteSpace = "pre-wrap";

                // add cell element itself to content list
                columns.push(cell);
            }

            // apply additional styles
            if (component.styles[i]) {
                var style = component.styles[i];
                DOM.applyStyleTo((style instanceof Style) ?
                    style : new Style(style), cell);
            }
            if (component.widths[i]) {
                cell.style.width = component.widths[i]!;
            }
        });

        // update TR content
        out.updated = this.context.updateAsync(columns, true);

        return out;
    }

    /** Table head DOM element */
    protected thead: HTMLElement;

    /** Table body DOM element */
    protected tbody: HTMLElement;
}

// Add style override and apply style sheet
TableRow.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        display: "table-row",
        cursor: "inherit"
    }
});
