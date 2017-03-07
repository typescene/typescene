import { Style } from "../../../Style";
import { Block } from "../../../Components";
import { List } from "../../../Components/Blocks/List";
import { TreeList } from "../../../Components/Blocks/TreeList";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { Renderer as BlockRenderer } from "./Block";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(List)
@mapComponentRenderer(TreeList)
export class Renderer<T extends Block> extends BlockRenderer<T> {
    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // add all items and dividers, if any
        out.updated = this.context.updateAsync(this.component.getChildren(),
            false,
            this.component.renderOptions &&
            this.component.renderOptions.animateListItems);

        return out;
    }
}

// Add style override
List.addStyleOverride(Style.withClass("UI-List"));
TreeList.addStyleOverride(Style.withClass("UI-TreeList"));
