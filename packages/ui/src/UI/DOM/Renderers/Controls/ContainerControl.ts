import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { Container } from "../../../Components/Containers/Container";
import { ContainerControl } from "../../../Components/Controls/ContainerControl";
import { Style } from "../../../Style";
import { Renderer as ControlRenderer } from "./ControlElement";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(ContainerControl)
export class Renderer<T extends ContainerControl<Container>> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // override line-height for this element
        component.style.set({ lineHeight: "0" });
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();

        // update with current container component
        out.updated = this.context.updateAsync([this.component.container]);

        return out;
    }
}
