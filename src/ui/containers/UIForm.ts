import { ComponentEventHandler, managed, ManagedRecord, bind } from "../../core";
import { UIRenderableConstructor } from "../UIComponent";
import { UICell } from "./UICell";
import { UIRenderableController } from "../UIRenderableController";
import { UIFormContext } from "../UIFormContext";

/** Base class for encapsulated cell */
const _FormCell = UICell.with({ style: "form", accessibleRole: "form" });

/**
 * Represents a UI component that groups form controls and other content in a cell.
 * @note This component encapsulates content in a `UICell` component. To set a form context binding without grouping content, use `UIFormContextController`.
 */
export class UIForm extends UIRenderableController {
  static preset(
    presets: UIForm.Presets,
    ...rest: Array<UIRenderableConstructor | undefined>
  ) {
    let formContextPreset = presets.formContext || bind("formContext");
    delete presets.formContext;
    let CellClass = _FormCell.with(presets, ...rest);
    this.presetBoundComponent("content", CellClass).limitBindings("formContext");
    return super.preset({ formContext: formContextPreset }, CellClass);
  }

  /** Form state context; should be bound to a `UIFormContext` component */
  @managed
  formContext?: UIFormContext;
}

export namespace UIForm {
  /** UIForm presets type, for use with `Component.with` */
  export interface Presets extends UICell.Presets {
    /** Form state context; should be bound to a `UIFormContext` component. If not set, automatically binds to a 'formContext' property on the bound parent component */
    formContext?: ManagedRecord;
    /** Event handler for form submissions */
    onSubmit: ComponentEventHandler<UIForm>;
  }
}
