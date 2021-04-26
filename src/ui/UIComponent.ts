import {
  Component,
  ComponentConstructor,
  ComponentEvent,
  ManagedEvent,
  Binding,
} from "../core";
import { err, ERROR } from "../errors";
import { UIContainer } from "./containers";
import { UIRenderContext } from "./UIRenderContext";
import { UIStyle } from "./UIStyle";
import { UITheme } from "./UITheme";

/** String type or object with toString method */
export type Stringable = string | { toString(): string };

/** Empty style instance, used on plain UIComponent instances */
const _emptyStyle = new UIStyle();

/** Event handler type (see `Component.with`), as a string or function */
export type UIComponentEventHandler<TComponent = UIComponent, TEvent = UIComponentEvent> =
  | string
  | ((this: TComponent, e: TEvent) => void);

/** Event that is emitted on a particular UI component */
export class UIComponentEvent<
  TSource extends UIComponent = UIComponent
> extends ComponentEvent<TSource> {
  constructor(name: string, source: TSource, inner?: ManagedEvent, event?: any) {
    super(name, source, inner);
    this.event = event;
  }

  /** Platform event, if any */
  readonly event?: any;
}

/** Event that is emitted on a particular UI component before it is fist rendered, __only once__. Instances should not be reused. */
export class UIBeforeRenderEvent<TSource extends UIComponent> extends ManagedEvent {
  /** Create a new event to be emitted before given component is rendered */
  constructor(source: TSource) {
    super("BeforeRender");
    this.source = source;
  }

  /** Event source UI component */
  readonly source: TSource;
}

/** Event that is emitted on a particular UI component when it is rendered, to be handled by a platform specific renderer (observer). Instances should not be reused. */
export class UIRenderEvent<TSource extends UIComponent> extends ManagedEvent {
  /** Create a new event that encapsulates given render callback (from the application level `UIRenderContext`, or from a containing UI component) */
  constructor(source: TSource, renderCallback: UIRenderContext.RenderCallback) {
    super("UIRender");
    this.source = source;
    this.renderCallback = renderCallback;
  }

  /** Event source UI component */
  readonly source: TSource;

  /** Initial render callback, to be called only once. The callback always returns a new callback that can be used for further updates. */
  readonly renderCallback: UIRenderContext.RenderCallback;
}

/** Focus request type, used by `UIComponent.requestFocus` */
export enum UIFocusRequestType {
  SELF = 0,
  FORWARD = 1,
  REVERSE = -1,
}

/** Event that is emitted on a particular UI component when it requests focus for itself or a sibling component; handled by the component renderer if possible. Instances should not be reused or re-emitted. */
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

/** Type definition for a component that can be rendered on its own */
export interface UIRenderable extends Component {
  /** Trigger asynchronous rendering for this component, and all contained components (if any) */
  render: UIComponent["render"];
}

/** Type definition for a constructor of a component that can be instantiated and rendered on its own (see `UIRenderable`) */
export type UIRenderableConstructor = ComponentConstructor<UIRenderable> &
  (new () => UIRenderable);

/** Represents a visible part of the user interface. */
export abstract class UIComponent extends Component implements UIRenderable {
  static preset(presets: UIComponent.Presets, ...rest: unknown[]): Function {
    // replace `requestFocus` with event handler
    if (presets.requestFocus) {
      delete presets.requestFocus;
      presets.onRendered = function () {
        if (!this._requestedFocusBefore) {
          this._requestedFocusBefore = true;
          this.requestFocus();
        }
      };
    }

    // preset style properties, remove from preset object itself
    let style: UIStyle | undefined, styleName: string | undefined;
    if (typeof presets.style === "string") styleName = presets.style;
    else style = presets.style;
    let dimensions = presets.dimensions;
    let position = presets.position;
    delete presets.style;
    delete presets.dimensions;
    delete presets.position;
    let origStyle: UIStyle | undefined;
    let origDimensions: Readonly<UIStyle.Dimensions> | undefined;
    let origPosition: Readonly<UIStyle.Position> | undefined;
    if (Binding.isBinding(style)) {
      (this as any).presetBinding("style", style, function (this: UIComponent, v: any) {
        this.style = v ? origStyle!.mixin(v) : origStyle!;
      });
      style = undefined;
    }
    if (Binding.isBinding(dimensions)) {
      (this as any).presetBinding(
        "dimensions",
        dimensions,
        function (this: UIComponent, v: any) {
          this.dimensions = v ? { ...origDimensions!, ...v } : origDimensions;
        }
      );
      dimensions = undefined;
    }
    if (Binding.isBinding(position)) {
      (this as any).presetBinding(
        "position",
        position,
        function (this: UIComponent, v: any) {
          this.position = v ? { ...origPosition!, ...v } : origPosition;
        }
      );
      position = undefined;
    }

    // return preset function
    let f = super.preset(presets, ...rest);
    return function (this: UIContainer) {
      f.call(this);
      let mixin = style || (styleName && UITheme.current.styles[styleName]);
      if (mixin) {
        if (this._style === _emptyStyle) this.style = mixin;
        else this.style = this._style.mixin(mixin);
      } else origStyle = this.style;
      if (dimensions) this.dimensions = { ...this.dimensions, ...dimensions };
      else origDimensions = this.dimensions;
      if (position) this.position = { ...this.position, ...position };
      else origPosition = this.position;
    };
  }

  /** Create and emit a UI event with given name and a reference to this component, as well as an optional platform event.
   * @deprecated in v3.1 */
  propagateComponentEvent(name: string, inner?: ManagedEvent, event?: any) {
    if (!this.managedState) return;
    if (!event && inner instanceof UIComponentEvent) {
      event = inner.event;
    }
    this.emit(UIComponentEvent, name, this, inner, event);
  }

  /** Override event delegation, to _also_ propagate events of type `UIComponentEvent` */
  protected delegateEvent(e: ManagedEvent, propertyName: string) {
    if (super.delegateEvent(e, propertyName) !== true && e instanceof UIComponentEvent) {
      this.emit(e);
      return true;
    }
  }

  /** Trigger asynchronous rendering for this component, and all contained components (if any). Rendered output is passed to given callback (from the application level `UIRenderContext`, or from a containing UI component). */
  render(callback: UIRenderContext.RenderCallback) {
    if (!this._firstRendered) {
      this._firstRendered = true;
      this.emit(UIBeforeRenderEvent, this);
    }
    this.emit(UIRenderEvent, this, callback);
  }

  private _firstRendered?: boolean;

  /** Returns true if this component can be focused directly using mouse or touch, or manually using `UIComponent.requestFocus`. This method may be overridden by derived component classes, but the return value must be constant for each instance. */
  isFocusable() {
    return false;
  }

  /** Returns true if this component can be focused using the keyboard as well as using other methods (rather than direct manipulation only). This method may be overridden by derived component classes, but the return value must be constant for each instance. */
  isKeyboardFocusable() {
    return false;
  }

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

  /** Applies given style set to individual style objects (e.g. `UIComponent.dimensions`). This method is overridden by derived classes to copy only applicable styles */
  protected applyStyle(style?: UIStyle) {
    if (!style) return;
    this.dimensions = style.getStyles().dimensions;
    this.position = style.getStyles().position;
  }

  /**
   * Combined style set, as an instance of `UIStyle`; individual style object properties can be overridden, which will not affect the `style` property.
   * @note When this property is preset (using `.with(...)`), the preset value is _mixed in_ to the current style set, rather than replacing it altogether. The result is always applied before individual style objects such as `dimensions` and `position`. However, setting this property directly on a component instance will completely remove existing styles.
   */
  get style() {
    return this._style;
  }
  set style(v) {
    if (v === this._style) return;
    if (!(v instanceof UIStyle)) {
      throw err(ERROR.UIStyle_Invalid);
    }
    this.applyStyle((this._style = v));
  }
  private _style = _emptyStyle;

  /** Set to true to hide this component from view (does not stop the component from being rendered) */
  hidden?: boolean;

  /** Options for the dimensions of this component */
  dimensions!: Readonly<UIStyle.Dimensions>;

  /** Options for the positioning of this component within parent component(s) */
  position!: Readonly<UIStyle.Position>;

  /** WAI-ARIA role for this component, if applicable */
  accessibleRole?: string;

  /** WAI-ARIA label text for this component (not tooltip), if applicable */
  accessibleLabel?: string;

  /** Last rendered output, if any; set by the renderer */
  lastRenderOutput?: UIRenderContext.Output<this>;

  private _requestedFocusBefore?: boolean;
}

export namespace UIComponent {
  /** UIComponent base presets type, for use with `Component.with` */
  export interface Presets {
    /** Style set (either an instance of `UIStyle` *or* the name of a style set defined in `UITheme.current`), which is *mixed into* the current style set on the component, before setting any other style properties */
    style?: UIStyle | string;
    /** Set to true to hide this component from view (does not stop the component from being rendered) */
    hidden?: boolean;
    /** Options for the dimensions of this component (overrides) */
    dimensions?: Partial<UIStyle.Dimensions | {}>;
    /** Options for the positioning of this component within parent component(s) (overrides) */
    position?: Partial<UIStyle.Position | {}>;
    /** WAI-ARIA role for this component, if applicable */
    accessibleRole?: string;
    /** WAI-ARIA label text for this component (not tooltip), if applicable */
    accessibleLabel?: string;
    /** Set to true to request focus immediately after rendering for the first time; cannot be used together with `onRendered` */
    requestFocus?: boolean;

    // general event handlers
    onRendered?: string | ((this: UIComponent) => void);
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

  /** Stateful renderer for dynamic content (used by `UIRenderableController`, `ViewComponent`, etc.) */
  export class DynamicRendererWrapper {
    constructor() {}

    /** Render given content using given callback, or previously stored callback */
    render(content?: UIRenderable, callback?: UIRenderContext.RenderCallback) {
      this._seq++;
      if (!content && this._renderCallback) {
        // content went missing, use old callback to remove output
        this._renderCallback = this._renderCallback(undefined);
      }
      if (callback && callback !== this._renderCallback) {
        // save callback first
        if (this._renderCallback) this._renderCallback(undefined);
        this._renderCallback = callback;
      }
      if (content && this._renderCallback) {
        // render content now
        let seq = this._seq;
        let renderProxy: UIRenderContext.RenderCallback = (output, afterRender) => {
          if (seq === this._seq) {
            this._renderCallback = this._renderCallback!(output, afterRender);
            seq = ++this._seq;
          }
          return renderProxy;
        };
        content.render(renderProxy);
      }
    }

    /** Remove previously rendered output */
    removeAsync() {
      if (!this._renderCallback) return;
      return new Promise(resolve => {
        this._renderCallback = this._renderCallback!(undefined, resolve);
        this._seq++;
      });
    }

    private _renderCallback?: UIRenderContext.RenderCallback;
    private _seq = 0;
  }
}
