import { Binding, ComponentConstructor, delegateEvents, managedChild } from "../../core";
import { err, ERROR } from "../../errors";
import { UIComponent, UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIRenderableController } from "../UIRenderableController";
import { UIRenderContext, UIRenderPlacement } from "../UIRenderContext";

/** Renderable wrapper for a single component that can be used to display another component as a modal view. The modal component is created immediately after the `ShowModal` event is emitted, and removed when the `CloseModal` event is emitted. */
export class UIModalController extends UIRenderableController {
  static preset(
    presets: UIModalController.Presets,
    Content?: ComponentConstructor<UIComponent> & (new () => UIComponent),
    Modal?: UIRenderableConstructor
  ): Function {
    let ModalClass = Modal || presets.modal;
    delete presets.modal;
    if (Binding.isBinding(ModalClass)) {
      throw err(ERROR.UIModalController_Binding);
    }
    if (Content) {
      this.presetBoundComponent("content", Content).limitBindings();
    }
    if (ModalClass) {
      this.presetBoundComponent("modal", ModalClass).limitBindings();
      this.prototype._ModalClass = ModalClass;
    }
    return super.preset(presets, Content);
  }

  /** Handle 'ShowModal' events delegated from content components, by creating the modal component */
  onShowModal() {
    this.showModal();
    return true;
  }

  /** Handle 'CloseModal' events delegated from content or modal components, by removing the modal component */
  onCloseModal() {
    this.closeModal();
    return true;
  }

  /** Show the (preset) modal component */
  showModal() {
    if (this._ModalClass) this.modal = new this._ModalClass();
  }

  /** Remove the currently showing modal component, if any */
  closeModal() {
    this.modal = undefined;
  }

  /** The current modal component to be displayed, as a managed child reference, or undefined if the modal component is currently not displayed */
  @delegateEvents
  @managedChild
  modal?: UIRenderable;

  /** Modal view placement, defaults to Dialog */
  placement = UIRenderPlacement.DIALOG;

  /** Modal backdrop opacity (0-1) */
  modalShadeOpacity?: number;

  // set on prototype
  private _ModalClass?: UIRenderableConstructor;
}

UIModalController.addObserver(
  class {
    constructor(public controller: UIModalController) {}

    /** Render a new modal component when needed */
    onModalChange() {
      if (this._renderCallback) {
        this._renderCallback = this._renderCallback(undefined);
      }
      if (this.controller.modal && this.controller.renderContext) {
        let ref = this._getReferenceComponent();
        if (ref) {
          this._renderCallback = this.controller.renderContext.getRenderCallback() as any;
          let callbackProxy: UIRenderContext.RenderCallback = (output, afterRender) => {
            if (!this._renderCallback) return callbackProxy;
            if (output && output.element) {
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
  }
}
