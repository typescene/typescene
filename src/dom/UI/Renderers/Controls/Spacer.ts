import { Spacer, mapComponentRenderer } from "@typescene/core/UI";
import { Renderer as ControlRenderer } from "./ControlElement";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Spacer)
export class Renderer<T extends Spacer> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // set element content to a single zero-width space character
        this.element.innerHTML = "&#8203;";

        // watch height and adjust line-height along with it
        this.watch(() => component.height, height => {
            component.style.set({ lineHeight: height });
        });
    }
}
