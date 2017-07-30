import * as Async from "@typescene/core/Async";
import { Block, mapComponentRenderer, Style } from "@typescene/core/UI";
import { Renderer as BlockRenderer } from "../Renderers/Blocks/Block";
import * as DOM from "./";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-DOMBlock";

/** Platform specific Block base class: full-width horizontal block containing DOM element(s) */
export class DOMBlock extends Block {
    /** Create a new block component with given content */
    constructor(...elements: Array<Node | Async.ObservableValue<Node>>);
    /** Create a new block component with elements from the given DOM fragment */
    constructor(documentFragment: DocumentFragment);
    constructor(...elts: any[]) {
        super();

        // lift all child nodes from a document fragment
        if (elts && elts[0] && elts[0].nodeType === 11) {
            var current = (<DocumentFragment>elts[0]).firstChild;
            var nodes: Node[] = [];
            while (current) {
                nodes.push(current);
                current = current.nextSibling;
            }
            this.nodes = nodes;
        }
        else {
            // just copy array of nodes
            this.nodes = elts;
        }
    }

    /** Array of DOM nodes (observed) */
    @Async.observable_not_null
    public nodes: Array<Node | undefined>;
}

/** @internal DOM-specific component renderer */
@mapComponentRenderer(DOMBlock)
export class Renderer<T extends DOMBlock> extends BlockRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // add all DOM nodes
        out.updated = this.context.updateAsync(this.component.nodes);

        return out;
    }
}

DOMBlock.addStyleOverride(Style.withClass(CSS_CLASS));
