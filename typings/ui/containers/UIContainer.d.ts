import { ManagedList } from "../../core";
import { UIComponent, UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
/** Represents a UI component that contains other components (abstract) */
export declare abstract class UIContainer extends UIComponent {
    static preset(presets: UIContainer.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    protected applyStyle(style: UIStyle): void;
    /** Apply properties from given object on top of the default `containerLayout` properties from the current style set */
    protected applyLayout(layout: Partial<UIStyle.ContainerLayout>): void;
    /** Create a new container component */
    constructor(...content: UIRenderable[]);
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** True if this container may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;
    /** True if this list may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;
    /** Options for layout of child components within this container */
    layout: UIStyle.ContainerLayout;
    /** Child separator options */
    separator?: UIStyle.SeparatorOptions;
    /** Set to true to render all child components asynchronously (results in smoother updates with slightly longer lead times) */
    asyncContentRendering?: boolean;
    /** Effect duration for animated transitions (milliseconds), if any */
    animatedContentRenderingDuration?: number;
    /** Effect velocity for animated transitions (screen distance per second), if any */
    animatedContentRenderingVelocity?: number;
    /** Content components list */
    readonly content: ManagedList<UIRenderable>;
}
export declare namespace UIContainer {
    /** UIContainer presets type, for use with `Component.with` */
    interface Presets extends UIComponent.Presets {
        /** List of container content */
        content?: Iterable<UIRenderable>;
        /** Options for layout of child components within this container (overrides) */
        layout?: Partial<UIStyle.ContainerLayout | {}>;
        /** Child separator options (plain object) */
        separator?: UIStyle.SeparatorOptions;
        /** Set to true if this container may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus`, defaults to false */
        allowFocus?: boolean;
        /** Set to true if this container may receive input focus using the keyboard and all other methods, defaults to false */
        allowKeyboardFocus?: boolean;
        /** Set to true to render all child components asynchronously (results in smoother updates with slightly longer lead times) */
        asyncContentRendering?: boolean;
        /** Effect duration for animated transitions (milliseconds), if any */
        animatedContentRenderingDuration?: number;
        /** Effect velocity for animated transitions (screen distance per second), if any */
        animatedContentRenderingVelocity?: number;
    }
}
