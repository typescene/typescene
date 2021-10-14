import {
  Binding,
  Component,
  ComponentEvent,
  delegateEvents,
  managedChild,
  ManagedList,
} from "../../core";
import { UIComponent, UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";

/** Represents a UI component that contains other components (abstract) */
export abstract class UIContainer extends UIComponent {
  static preset(
    presets: UIContainer.Presets,
    ...components: Array<UIRenderableConstructor | undefined>
  ): Function {
    let layout = presets.layout;
    delete presets.layout;
    let origLayout: Readonly<UIStyle.ContainerLayout> | undefined;
    if (Binding.isBinding(layout)) {
      (this as any).presetBinding("layout", layout, function (this: UIContainer, v: any) {
        this.layout = v ? { ...origLayout!, ...v } : origLayout;
      });
      layout = undefined;
    }
    let f = super.preset(presets, ...components);
    return function (this: UIContainer) {
      f.call(this);
      if (layout) this.layout = { ...this.layout, ...layout };
      else origLayout = this.layout;
      if (components.length) {
        this.content.add(...components.filter(C => !!C).map(C => new C!()));
      }
    };
  }

  /** Create a new container view component */
  constructor(...content: UIRenderable[]) {
    super();
    this.content = new ManagedList()
      .restrict<UIRenderable>(Component as any)
      .propagateEvents(ComponentEvent);
    if (content.length) this.content.replace(content);
  }

  protected applyStyle(style?: UIStyle) {
    if (!style) return;
    super.applyStyle(style);
    this.layout = style.getStyles().containerLayout;
  }

  isFocusable() {
    return !!(this.allowFocus || this.allowKeyboardFocus);
  }

  isKeyboardFocusable() {
    return !!this.allowKeyboardFocus;
  }

  /** True if this container *itself* may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
  allowFocus?: boolean;

  /** True if this container *itself* may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
  allowKeyboardFocus?: boolean;

  /** Options for layout of child components within this container */
  layout!: Readonly<UIStyle.ContainerLayout>;

  /** Set to true to render all child components asynchronously (results in smoother updates with slightly longer lead times) */
  asyncContentRendering?: boolean;

  /** Effect duration for animated transitions (milliseconds), if any */
  animatedContentRenderingDuration?: number;

  /** Effect velocity for animated transitions (screen distance per second), if any */
  animatedContentRenderingVelocity?: number;

  /** Content components list */
  @delegateEvents
  @managedChild
  readonly content: ManagedList<UIRenderable>;
}

export namespace UIContainer {
  /** UIContainer presets type, for use with `Component.with` */
  export interface Presets extends UIComponent.Presets {
    /** List of container content */
    content?: Iterable<UIRenderable>;
    /** Options for layout of child components within this container (overrides) */
    layout?: Partial<UIStyle.ContainerLayout | {}>;
    /** True if this container *itself* may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;
    /** True if this container *itself* may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;
    /** Set to true to render all child components asynchronously (results in smoother updates with slightly longer lead times) */
    asyncContentRendering?: boolean;
    /** Effect duration for animated transitions (milliseconds), if any */
    animatedContentRenderingDuration?: number;
    /** Effect velocity for animated transitions (screen distance per second), if any */
    animatedContentRenderingVelocity?: number;
  }
}
