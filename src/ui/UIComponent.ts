import { Component, ComponentConstructor, ComponentEvent, ManagedEvent } from "../core";
import { UIContainer } from "./containers";
import { UIRenderContext } from "./UIRenderContext";
import { UIStyle } from "./UIStyle";
import { UITheme } from "./UITheme";

/** Empty style instance, used on plain UIComponent instances */
let _emptyStyle = new UIStyle();

/** Event handler type (see `Component.with`), as a string or function */
export type UIComponentEventHandler<TComponent = UIComponent, TEvent = UIComponentEvent> =
    string | ((this: TComponent, e: TEvent) => void);

/** Event that is emitted on a particular UI component, propagated by all parent UI components. */
export class UIComponentEvent<TSource extends UIComponent = UIComponent> extends ComponentEvent {
    constructor(name: string, source: TSource, inner?: ManagedEvent, event?: any) {
        super(name, source, inner);
        this.event = event;
    }

    /** Event source UI component */
    readonly source!: TSource;

    /** Platform event, if any */
    readonly event?: any;
}

/** Event that is emitted on a particular UI component before it is fist rendered, only once. Should not be propagated. */
export class UIBeforeFirstRenderEvent<TSource extends UIComponent> extends ManagedEvent {
    /** Create a new event to be emitted before given component is rendered */
    constructor(source: TSource) {
        super("BeforeRender");
        this.source = source;
    }

    /** Event source UI component */
    readonly source: TSource;
}

/** Event that is emitted on a particular UI component when it is rendered, to be handled by a platform specific renderer (observer). Should not be propagated. */
export class UIRenderEvent<TSource extends UIComponent> extends ManagedEvent {
    /** Create a new event that encapsulates given render callback (from the application level `RenderContext`, or from a containing UI component) */
    constructor(source: TSource, renderCallback: UIRenderContext.RenderCallback) {
        super("UIRender");
        this.source = source;
        this.renderCallback = renderCallback;
    }

    /** Event source UI component */
    readonly source: TSource;

    /** Initial render callback, to be called only once */
    readonly renderCallback: UIRenderContext.RenderCallback;
}

/** Focus request type, used by `UIComponent.requestFocus` */
export enum UIFocusRequestType { SELF, FORWARD, REVERSE }

/** Simple animated transition type, used for `UIComponent.revealTransition` and `UIComponent.exitTransition` */
export type UITransitionType = "right" | "left" | "up" | "down" | "fade" |
    "right-fast" | "left-fast" | "up-fast" | "down-fast" | "fade-fast";

/** Event that is emitted on a particular UI component when it requests focus for itself or a sibling component; handled by the component renderer if possible. Should not be propagated. */
export class UIFocusRequestEvent<TSource extends UIComponent> extends ManagedEvent {
    /** Create a new event for a focus request for given component and/or direction (self/reverse/forward, defaults to self) */
    constructor(source: TSource, direction: UIFocusRequestType = UIFocusRequestType.SELF) {
        super("UIFocusRequest");
        this.source = source;
        this.direction = direction;
    }

    /** Event source UI component */
    readonly source: TSource;

    /** Focus direction */
    readonly direction: UIFocusRequestType;
}

/** Represents a visible part of the user interface. */
export abstract class UIComponent extends Component {
    static preset(presets: UIComponent.Presets, ...rest: unknown[]): Function {
        // replace `requestFocus` with event handler
        if (presets.requestFocus) {
            delete presets.requestFocus;
            presets.onRendered = (e: UIComponentEvent) => {
                if (!e.source._requestedFocusBefore) {
                    e.source._requestedFocusBefore = true;
                    e.source.requestFocus();
                }
            }
        }

        // remove style properties from preset object itself
        let style: UIStyle | undefined, styleName: string | undefined;
        if (typeof presets.style === "string") styleName = presets.style;
        else style = presets.style;
        let dimensions = presets.dimensions;
        let position = presets.position;
        delete presets.style;
        delete presets.dimensions;
        delete presets.position;

        // return preset function
        let f = super.preset(presets, ...rest);
        return function (this: UIContainer) {
            let mixin = style || (styleName && UITheme.current.styles[styleName]);
            if (mixin) {
                if (this._style === _emptyStyle) this.style = mixin;
                else this.style = this._style.mixin(mixin);
            }
            if (dimensions) this.dimensions = { ...this.dimensions, ...dimensions };
            if (position) this.position = { ...this.position, ...position };
            return f.call(this);
        };
    }

    /** Create a new UI component */
    constructor() {
        super();
        this.propagateChildEvents(UIComponentEvent);
    }

    /** Create and emit a UI event with given name and a reference to this component, as well as an optional platform event; see `Component.propagateComponentEvent` */
    propagateComponentEvent(name: string, inner?: ManagedEvent, event?: any) {
        if (!event && (inner instanceof UIComponentEvent)) {
            event = inner.event;
        }
        this.emit(UIComponentEvent, name, this, inner, event);
    }

    /** Trigger asynchronous rendering for this component, and all contained components (if any). Rendered output is passed to given callback (from the application level `RenderContext`, or from a containing UI component). */
    render(callback: UIRenderContext.RenderCallback) {
        if (!this._firstRendered) {
            this._firstRendered = true;
            this.emit(UIBeforeFirstRenderEvent, this);
        }
        this.emit(UIRenderEvent, this, callback);
    }

    private _firstRendered?: boolean;

    /** Returns true if this component can be focused directly using mouse or touch, or manually using `UIComponent.requestFocus`. This method may be overridden by derived component classes, but the value returned must always be the same. */
    isFocusable() { return false }

    /** Returns true if this component can be focused using the keyboard *or* other methods; a true return value implies the same for `UIComponent.isFocusable`. This method may be overridden by derived component classes, but the value returned must always be the same. */
    isKeyboardFocusable() { return false }

    /**
     * Request input focus on this component.
     * @note Not all components can be focused. Components can only be focused after they are rendered, so consider using this method inside of a `Rendered` event handler.
     */
    requestFocus() {
        this.emit(UIFocusRequestEvent, this);
    }

    /** Request input focus for the next sibling component */
    requestFocusNext() {
        this.emit(UIFocusRequestEvent, this, UIFocusRequestType.FORWARD);
    }

    /** Request input focus for the previous sibling component */
    requestFocusPrevious() {
        this.emit(UIFocusRequestEvent, this, UIFocusRequestType.REVERSE);
    }

    /** Applies given style set to individual style objects (e.g. `UIComponent.dimensions`), overridden in derived classes to copy applicable styles */
    protected applyStyle(style: UIStyle) {
        this.dimensions = style.getStyles().dimensions;
        this.position = style.getStyles().position;
    }
    
    /** Combined style set; when this is set to an instance of `UIStyle`, the individual style object properties (e.g. `UIComponent.dimensions`) are set to read-only objects taken from the `UIStyle` instance. To override individual properties, set these properties *after* setting `style`, or use `Component.with` to create a new constructor. */
    get style() { return this._style }
    set style(v) {
        if (v === this._style) return;
        if (!(v instanceof UIStyle)) {
            throw TypeError("[UIComponent] Invalid style set instance");
        }
        this.applyStyle(this._style = v);
    }
    private _style = _emptyStyle;
    private _requestedFocusBefore?: boolean;

    /** Set to true to hide this component from view (while it is still rendered) */
    hidden?: boolean;

    /** Options for the dimensions of this component */
    dimensions!: UIStyle.Dimensions;

    /** Options for the positioning of this component within parent component(s) */
    position!: UIStyle.Position;

    /** Animated transition that plays when this component is first rendered */
    revealTransition?: UITransitionType;

    /** Animated transition that plays when this component is removed from a container */
    exitTransition?: UITransitionType;

    /** Last rendered output, if any; set by the renderer */
    lastRenderOutput?: UIRenderContext.Output<this>;
}

export namespace UIComponent {
    /** UIComponent base presets type, for use with `Component.with` */
    export interface Presets {
        /** Style set (either an instance of `UIStyle` *or* the name of a style set defined in `UITheme.current`), which is *mixed into* the current style set on the component, before setting any other style properties */
        style?: UIStyle | string;
        /** Set to true to hide this component from view (while it is still rendered) */
        hidden?: boolean;
        /** Options for the dimensions of this component (overrides) */
        dimensions?: Partial<UIStyle.Dimensions | {}>;
        /** Options for the positioning of this component within parent component(s) (overrides) */
        position?: Partial<UIStyle.Position | {}>;
        /** Set to true to request focus immediately after rendering for the first time; cannot be used together with `onRendered` */
        requestFocus?: boolean;
        /** Animation that plays when this component is first rendered */
        revealTransition?: UITransitionType;
        /** Animation that plays when this component is removed from a container */
        exitTransition?: UITransitionType;

        // general event handlers
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

/** Type definition for a component that can be rendered on its own */
export interface UIRenderable extends Component {
    render: UIComponent["render"];
}

/** Type definition for a constructor of a component that can be rendered on its own (see `UIRenderable`) */
export type UIRenderableConstructor = ComponentConstructor & (new () => UIRenderable);
