import {
  Binding,
  Component,
  managed,
  ManagedList,
  ManagedMap,
  onPropertyChange,
  bind,
} from "../core";
import { UIComponent, UIRenderable } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";

/** Renderable component that encapsulates a referenced view (view component or activity), which is _not_ a child component of the component itself. The view may be selected from a bound list and/or map, using a (bound or assigned) index.
 * @note Because the rendered view is not a child component, events (including UI events such as 'Clicked') never propagate up to the containing component(s).
 */
export class UIViewRenderer extends Component implements UIRenderable {
  static preset(presets: UIViewRenderer.Presets): Function {
    return super.preset(presets);
  }

  /** Returns a preset constructor for a view renderer that displays a view from the `content` property on the bound parent component (i.e. view is set to `bind("content")`); can be used on `ViewComponent` classes that reference content views using this property */
  static withBoundContent() {
    return this.with({ view: bind("content") });
  }

  /** List of indexed views and/or view activities, _not_ child components */
  @managed
  managedList?: ManagedList<UIRenderable>;

  /** Map of named views and/or view activities, _not_ child components */
  @managed
  managedMap?: ManagedMap<UIRenderable>;

  /** Index of the view to be rendered from `managedList` (if number) or `managedMap` (if string), defaults to 0 */
  index: number | string = 0;

  /** The current view (or view activity) to be rendered, can be bound, or automatically selected using `managedList` or `managedMap` and `index` properties; _not_ a child component */
  @managed
  view?: UIRenderable;

  render(callback?: UIRenderContext.RenderCallback) {
    // skip extra rendering if view didn't actually change
    if (!callback && this.view === this._lastRendered) return;
    this._lastRendered = this.view;

    // use given callback to (re-) render view
    this._renderer.render(this.view, callback);
  }

  private _renderer = new UIComponent.DynamicRendererWrapper();
  private _lastRendered?: UIRenderable;
}

// observe to re-render when content changes
class UIViewRendererObserver {
  constructor(public readonly component: UIViewRenderer) {}
  onViewChange() {
    this.component.render();
  }
  @onPropertyChange("managedList", "managedMap", "index")
  updateView() {
    if (
      this.component.index >= 0 &&
      this.component.managedList &&
      this.component.index < this.component.managedList.count
    ) {
      let idx = this.component.index as number;
      this.component.view = this.component.managedList.get(idx);
    } else if (
      typeof this.component.index === "string" &&
      this.component.managedMap &&
      this.component.managedMap.has(this.component.index)
    ) {
      this.component.view = this.component.managedMap.get(this.component.index);
    } else {
      this.component.view = undefined;
    }
  }
}
UIViewRenderer.addObserver(UIViewRendererObserver);

export namespace UIViewRenderer {
  /** UIViewRenderer presets type, for use with `Component.with` */
  export interface Presets {
    /** Rendered view, if bound directly (cannot be used together with `managedList` or `managedMap` properties) */
    view?: Binding;
    /** List of renderable views (must be bound to either a `ManagedList` or `AppActivityList`), one of which can be selected for rendering using the `index` property */
    managedList?: Binding;
    /** Map of renderable views (must be bound to a `ManagedMap`), one of which can be selected for rendering using the `index` property */
    managedMap?: Binding;
    /** Index of the view to be rendered from the `managedList` or `managedMap` properties, defaults to 0 */
    index?: number | string;
  }
}
