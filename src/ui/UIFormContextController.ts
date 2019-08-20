import { ComponentEventHandler, managed, ManagedObject, ManagedRecord } from "../core";
import { FormContextChangeEvent } from "./containers/UIForm";
import { UIRenderableController } from "./UIRenderableController";

/**
 * Renderable wrapper that injects a form context record, to be used by (nested) child input controls.
 * @note This wrapper does not group content in a cell; see also `UIForm`.
 */
export class UIFormContextController extends UIRenderableController {
  /** Form state context; defaults to an empty managed record */
  @managed
  formContext: ManagedObject = new ManagedRecord();
}

// observe to emit event when form context changes
UIFormContextController.observe(
  class {
    constructor(public controller: UIFormContextController) {}
    onFormContextChange() {
      if (!this.controller.formContext) return;
      let event = new FormContextChangeEvent("FormContextChange", this.controller);
      event.formContext = this.controller.formContext;
      this.controller.emit(event);
    }
  }
);

export namespace UIFormContextController {
  /** UIFormStateController presets type, for use with `Component.with` */
  export interface Presets {
    /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
    formContext?: ManagedRecord;
    /** Event handler for any change to the form state */
    onFormContextChange: ComponentEventHandler<UIFormContextController>;
    /** Event handler for Enter key presses (ignoring Enter key presses on multiline text fields and buttons, which do not emit the EnterKeyPress event) */
    onEnterKeyPress: ComponentEventHandler<UIFormContextController>;
  }
}
