import { AppComponent } from "../app";
import { bind, ManagedObject } from "../core";
import { UIComponent, UIRenderable } from "./UIComponent";

/** @internal Render context binding, can be reused to avoid creating new bindings */
export const renderContextBinding = bind("renderContext");

/** Global view placement modes */
export enum UIRenderPlacement {
  NONE,
  PAGE,
  DIALOG,
  DRAWER,
  DROPDOWN,
  DROPDOWN_COVER,
  POPOVER,
  POPOVER_ABOVE,
  POPOVER_LEFT,
  POPOVER_RIGHT,
}

/** Base application render context, to be extended with platform specific render implementation. */
export abstract class UIRenderContext extends ManagedObject {
  /** Emit a change event for this context, e.g. when the viewport orientation or current locale changes. This will trigger all views to re-render if needed. */
  emitRenderChange() {
    this.emitChange();
  }

  /** Returns a list of all application components (activities, view components) that are associated with this render context */
  getAppComponents() {
    return this.getManagedReferrers().filter(c => c instanceof AppComponent);
  }

  /** Remove all rendered output from the screen */
  abstract clear(): void;

  /** Returns a callback that can be used to render an output element to the screen asynchronously. */
  abstract getRenderCallback(): UIRenderContext.RenderCallback<
    UIRenderContext.Output<never, never>
  >;
}

export namespace UIRenderContext {
  /** Callback function that accepts rendered output and returns a next callback. */
  export interface RenderCallback<TOutput extends Output = Output<UIRenderable, any>> {
    /**
     * One-time callback function that accepts rendered output and a callback function. This callback format is used by the `UIRenderContext` application renderer as well as renderers of UI components that contain other components.
     * @param output
     *  The rendered output. If this is undefined, the output is removed.
     * @param afterRender
     *  An optional callback that is invoked asynchronously after the element is placed on screen.
     * @returns A new callback function that should be used for the next update.
     */
    (output?: TOutput, afterRender?: (out?: Output) => void): RenderCallback<TOutput>;
  }

  /** Encapsulates a rendered output element, to be placed on screen by a platform specific `UIRenderContext` instance. */
  export class Output<TComponent extends UIRenderable = UIRenderable, TElement = any> {
    constructor(
      source: TComponent,
      element: TElement,
      placement?: UIRenderPlacement,
      reference?: UIComponent
    ) {
      this.source = source;
      this.element = element;
      this.placement = placement;
      this.placementRef = reference;
    }

    /** The rendered component */
    source: TComponent;

    /** The rendered element, as a platform-dependent object or handle */
    element: TElement;

    /** Placement mode, used by `UIRenderContext` for root output elements */
    placement?: UIRenderPlacement;

    /** Placement reference for dropdowns and popovers */
    placementRef?: UIComponent;

    /** Modal shade opacity behind content (0-1) */
    modalShadeOpacity?: number;

    /** Handler function, added by a previous parent renderer (if any), to detach the visible element from the previous parent's tree structure; any other renderer should call this method before adding the element to a new parent */
    detach?: () => void;
  }
}
