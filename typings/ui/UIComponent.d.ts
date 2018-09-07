import { Component, ComponentConstructor, ComponentEvent, ManagedEvent } from "../core";
import { UIRenderContext } from "./UIRenderContext";
import { UIStyle } from "./UIStyle";
export declare type UIComponentEventHandler<TComponent = UIComponent, TEvent = UIComponentEvent> = string | ((this: TComponent, e: TEvent) => void);
export declare class UIComponentEvent<TSource extends UIComponent = UIComponent> extends ComponentEvent {
    constructor(name: string, source: TSource, inner?: ManagedEvent, event?: any);
    readonly source: TSource;
    readonly event?: any;
}
export declare class UIBeforeFirstRenderEvent<TSource extends UIComponent> extends ManagedEvent {
    constructor(source: TSource);
    readonly source: TSource;
}
export declare class UIRenderEvent<TSource extends UIComponent> extends ManagedEvent {
    constructor(source: TSource, renderCallback: UIRenderContext.RenderCallback);
    readonly source: TSource;
    readonly renderCallback: UIRenderContext.RenderCallback;
}
export declare enum UIFocusRequestType {
    SELF = 0,
    FORWARD = 1,
    REVERSE = 2
}
export declare type UITransitionType = "right" | "left" | "up" | "down" | "fade" | "right-fast" | "left-fast" | "up-fast" | "down-fast" | "fade-fast";
export declare class UIFocusRequestEvent<TSource extends UIComponent> extends ManagedEvent {
    constructor(source: TSource, direction?: UIFocusRequestType);
    readonly source: TSource;
    readonly direction: UIFocusRequestType;
}
export declare abstract class UIComponent extends Component {
    static preset(presets: UIComponent.Presets, ...rest: unknown[]): Function;
    constructor();
    propagateComponentEvent(name: string, inner?: ManagedEvent, event?: any): void;
    render(callback: UIRenderContext.RenderCallback): void;
    private _firstRendered?;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    requestFocus(): void;
    requestFocusNext(): void;
    requestFocusPrevious(): void;
    protected applyStyle(style: UIStyle): void;
    style: UIStyle;
    private _style;
    private _requestedFocusBefore?;
    hidden?: boolean;
    dimensions: UIStyle.Dimensions;
    position: UIStyle.Position;
    revealTransition?: UITransitionType;
    exitTransition?: UITransitionType;
    lastRenderOutput?: UIRenderContext.Output<this>;
}
export declare namespace UIComponent {
    interface Presets {
        style?: UIStyle | string;
        hidden?: boolean;
        dimensions?: Partial<UIStyle.Dimensions | {}>;
        position?: Partial<UIStyle.Position | {}>;
        requestFocus?: boolean;
        revealTransition?: UITransitionType;
        exitTransition?: UITransitionType;
        onRendered?: UIComponentEventHandler;
        onBeforeRender?: UIComponentEventHandler;
        onFocusIn?: UIComponentEventHandler;
        onFocusOut?: UIComponentEventHandler;
        onClick?: UIComponentEventHandler;
        onDoubleClick?: UIComponentEventHandler;
        onContextMenu?: UIComponentEventHandler;
        onMouseUp?: UIComponentEventHandler;
        onMouseDown?: UIComponentEventHandler;
        onKeyUp?: UIComponentEventHandler;
        onKeyDown?: UIComponentEventHandler;
        onKeyPress?: UIComponentEventHandler;
        onEnterKeyPress?: UIComponentEventHandler;
        onSpacebarPress?: UIComponentEventHandler;
        onBackspaceKeyPress?: UIComponentEventHandler;
        onDeleteKeyPress?: UIComponentEventHandler;
        onEscapeKeyPress?: UIComponentEventHandler;
        onArrowLeftKeyPress?: UIComponentEventHandler;
        onArrowRightKeyPress?: UIComponentEventHandler;
        onArrowUpKeyPress?: UIComponentEventHandler;
        onArrowDownKeyPress?: UIComponentEventHandler;
    }
}
export interface UIRenderable extends Component {
    render: UIComponent["render"];
}
export declare type UIRenderableConstructor = ComponentConstructor & (new () => UIRenderable);
