import { Application } from "../app";
import {
  Binding,
  ComponentConstructor,
  ComponentEvent,
  ComponentEventHandler,
  managedChild,
} from "../core";
import { err, ERROR } from "../errors";
import { UIComponent, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderContext, UIRenderPlacement } from "./UIRenderContext";

/** Renderable wrapper for a single component that can be used to display another component as a modal view. The modal component is created immediately after the `ShowModal` event is emitted, and removed when the `CloseModal` event is emitted. */
export class UIModalController extends UIRenderableController {
  static preset(
    presets: UIModalController.Presets,
    content?: ComponentConstructor<UIComponent> & (new () => UIComponent),
    modal?: UIRenderableConstructor
  ): Function {
    let Modal = modal || presets.modal;
    delete presets.modal;
    if (Binding.isBinding(Modal)) {
      throw err(ERROR.UIModalController_Binding);
    }
    if (Modal) this.presetBindingsFrom(Modal);
    let f = super.preset(presets, content);
    return function (this: UIModalController) {
      f.call(this);
      this.propagateChildEvents(e => {
        if (e instanceof ComponentEvent) {
          if (e.name === "ShowModal") {
            let instance = Modal && new Modal();
            this.modal = instance || undefined;
            return;
          } else if (e.name === "CloseModal") {
            this.modal = undefined;
            return;
          }
          return e;
        }
      });
    };
  }

  /** The current modal component to be displayed, as a managed child reference, or undefined if the modal component is currently not displayed */
  @managedChild
  modal?: UIRenderable;

  /** Modal view placement, defaults to Dialog */
  placement = UIRenderPlacement.DIALOG;

  /** Modal backdrop opacity (0-1) */
  modalShadeOpacity?: number;

  /** True if clicking outside the modal component should close it, defaults to true */
  modalShadeClickToClose = true;
}
UIModalController.addObserver(
  class {
    constructor(public controller: UIModalController) {}

    /** Render a new modal component when needed */
    onModalChange() {
      if (this._renderCallback) {
        this._renderCallback = this._renderCallback(undefined);
      }
      if (this.controller.modal) {
        let ref = this._getReferenceComponent();
        let application = this.controller.getBoundParentComponent(Application);
        if (ref && application && application.renderContext) {
          this._renderCallback = application.renderContext.getRenderCallback() as any;
          let callbackProxy: UIRenderContext.RenderCallback = (output, afterRender) => {
            if (!this._renderCallback) return callbackProxy;
            if (output && output.element) {
              if (output.modalShadeClickToClose === undefined) {
                output.modalShadeClickToClose = this.controller.modalShadeClickToClose;
              }
              if (output.modalShadeOpacity === undefined) {
                output.modalShadeOpacity = this.controller.modalShadeOpacity;
              }
              if (!output.placement) {
                output.placement = this.controller.placement;
                output.placementRef = this._getReferenceComponent();
              }
              this._renderCallback = this._renderCallback(output, afterRender);
            } else {
              this._renderCallback = this._renderCallback(undefined);
              this.controller.modal = undefined;
            }
            return callbackProxy;
          };
          this.controller.modal.render(callbackProxy);
        }
      }
    }

    private _getReferenceComponent() {
      let renderable: UIRenderable | undefined = this.controller;
      while (renderable) {
        if (renderable instanceof UIComponent) return renderable;
        if (renderable instanceof UIRenderableController) {
          renderable = renderable.content;
        }
      }
    }

    private _renderCallback?: UIRenderContext.RenderCallback;
  }
);

export namespace UIModalController {
  /** UIModalController presets type, for use with `Component.with` */
  export interface Presets {
    /** Modal component constructor (can also be passed as an additional argument to `Component.with`) */
    modal?: UIRenderableConstructor;
    /** Modal view placement, defaults to Dialog */
    placement?: UIRenderPlacement;
    /** Modal backdrop opacity (0-1), defaults to 0 */
    modalShadeOpacity?: number;
    /** True if clicking outside the modal component should close it, defaults to true */
    modalShadeClickToClose?: boolean;
    /** Event handler that is invoked when the modal component is made visible */
    onShowModal: ComponentEventHandler<UIModalController>;
    /** Event handler that is invoked when the modal component is removed */
    onCloseModal: ComponentEventHandler<UIModalController>;
  }
}
