import { AppActivity } from "../../app";
import {
  Component,
  ComponentEvent,
  ComponentEventHandler,
  managed,
  ManagedObject,
  ManagedRecord,
} from "../../core";
import { UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIFormContextController } from "../controllers/UIFormContextController";
import { UITheme } from "../UITheme";
import { UICell } from "./UICell";

/**
 * Event that is emitted when the form context of a `UIForm` or `UIFormContextController` has been changed
 * @note Despite its name, this event does **not** inherit from `ManagedChangeEvent`.
 */
export class FormContextChangeEvent extends ComponentEvent {
  /** The current form context object */
  formContext!: ManagedObject;
}

/**
 * Represents a UI component that groups form controls and other content in a cell.
 * @note This component is optional and has the same effect as `UIFormContextController` which does not render its own cell.
 */
export class UIForm extends UICell {
  static preset(
    presets: UIForm.Presets,
    ...rest: Array<UIRenderableConstructor | undefined>
  ): Function {
    return super.preset(presets, ...rest);
  }

  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "form");
  }

  /**
   * Returns the closest parent form (or form context controller, see `UIFormContextController`) for given component; can be used by input components to find and observe the form context component before rendering.
   * Does not return components beyond the scope of the current `AppActivity` parent.
   */
  static find(component: Component) {
    let current: Component | undefined = component;
    while (current) {
      current = current.getParentComponent();
      if (current instanceof UIForm) return current;
      if (current instanceof UIFormContextController) return current;
      if (current instanceof AppActivity) break;
    }
  }

  accessibleRole = "form";

  /** Form state context; defaults to an empty managed record */
  @managed
  formContext: ManagedObject = new ManagedRecord();
}

// observe to emit event when form context changes
UIForm.addObserver(
  class {
    constructor(public form: UIForm) {}
    onFormContextChange() {
      if (!this.form.formContext) return;
      let event = new FormContextChangeEvent("FormContextChange", this.form);
      event.formContext = this.form.formContext;
      this.form.emit(event);
    }
  }
);

export namespace UIForm {
  /** UIForm presets type, for use with `Component.with` */
  export interface Presets extends UICell.Presets {
    /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
    formContext?: ManagedRecord;
    /** Event handler for any change to the form state */
    onFormContextChange: ComponentEventHandler<UIForm>;
    /** Event handler for form submissions */
    onSubmit: ComponentEventHandler<UIForm>;
  }
}
