import { ManagedEvent } from "../core";
import { UIComponent, UIRenderable, UIRenderableConstructor, UIRenderContext, UIRenderPlacement } from "../ui";
import { AppActivity } from "./AppActivity";
export declare class ViewActivity extends AppActivity {
    static preset(presets: ViewActivity.Presets, View?: UIRenderableConstructor): Function;
    constructor(name?: string, path?: string);
    view?: UIRenderable;
    placement?: UIRenderPlacement;
    modalShadeOpacity?: number;
    modalShadeClickToClose?: boolean;
    render(callback?: UIRenderContext.RenderCallback): void;
    removeViewAsync(): Promise<any>;
    restoreFocus(firstFocused?: boolean): void;
    firstFocused?: UIComponent;
    lastFocused?: UIComponent;
    showDialogAsync(View: UIRenderableConstructor, modalShadeClickToClose?: boolean, eventHandler?: (this: DialogViewActivity, e: ManagedEvent) => void): Promise<ViewActivity>;
    showConfirmationDialogAsync(message: string | string[], title?: string, confirmButtonLabel?: string, cancelButtonLabel?: string): Promise<boolean>;
    private _renderCallback?;
}
export declare class PageViewActivity extends ViewActivity {
    placement: UIRenderPlacement;
}
export declare class DialogViewActivity extends ViewActivity {
    placement: UIRenderPlacement;
    modalShadeOpacity: number;
}
export declare namespace ViewActivity {
    interface Presets extends AppActivity.Presets {
        view?: UIRenderableConstructor;
        placement?: UIRenderPlacement;
        modalShadeOpacity?: number;
        modalShadeClickToClose?: boolean;
    }
}
