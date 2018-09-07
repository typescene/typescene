import { ManagedList } from "../../core";
import { UIComponent, UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
export declare abstract class UIContainer extends UIComponent {
    static preset(presets: UIContainer.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    protected applyStyle(style: UIStyle): void;
    protected applyLayout(layout: Partial<UIStyle.ContainerLayout>): void;
    constructor(...content: UIRenderable[]);
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    allowFocus?: boolean;
    allowKeyboardFocus?: boolean;
    layout: UIStyle.ContainerLayout;
    separator?: UIStyle.SeparatorOptions;
    asyncContentRendering?: boolean;
    animatedContentRenderingDuration?: number;
    animatedContentRenderingVelocity?: number;
    readonly content: ManagedList<UIRenderable>;
}
export declare namespace UIContainer {
    interface Presets extends UIComponent.Presets {
        content?: Iterable<UIRenderable>;
        layout?: Partial<UIStyle.ContainerLayout | {}>;
        separator?: UIStyle.SeparatorOptions;
        allowFocus?: boolean;
        allowKeyboardFocus?: boolean;
        asyncContentRendering?: boolean;
        animatedContentRenderingDuration?: number;
        animatedContentRenderingVelocity?: number;
    }
}
