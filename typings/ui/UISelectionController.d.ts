import { UIComponent, UIRenderable } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
export declare class UISelectionController extends UIRenderableController {
    constructor(content?: UIRenderable);
    selected?: UIComponent;
}
