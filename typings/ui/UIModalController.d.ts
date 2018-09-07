import { ComponentConstructor } from "../core";
import { UIComponent, UIComponentEventHandler, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderPlacement } from "./UIRenderContext";
export declare class UIModalController extends UIRenderableController {
    static preset(presets: UIModalController.Presets, content?: ComponentConstructor & (new () => UIComponent), modal?: UIRenderableConstructor): Function;
    modal?: UIRenderable;
    placement: UIRenderPlacement;
    modalShadeOpacity: number;
    modalShadeClickToClose: boolean;
}
export declare namespace UIModalController {
    interface Presets {
        modal?: UIRenderableConstructor;
        placement?: UIRenderPlacement;
        modalShadeOpacity?: number;
        modalShadeClickToClose?: boolean;
        onShowModal: UIComponentEventHandler<UIModalController>;
        onCloseModal: UIComponentEventHandler<UIModalController>;
    }
}
