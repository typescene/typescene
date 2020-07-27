import { managed } from "../../core";
import { UIRenderableController } from "../UIRenderableController";
import { UIRenderableConstructor } from "../UIComponent";
import { UIFormContext } from "../UIFormContext";

/**
 * Renderable wrapper that injects a form context record, to be used by (nested) child input controls.
 * @note This wrapper does not group content in a cell; use `UIForm` for visual grouping.
 */
export class UIFormContextController extends UIRenderableController {
  static preset(
    presets: UIFormContextController.Presets,
    Content?: UIRenderableConstructor
  ) {
    if (Content) this.presetBoundComponent("content", Content).limitBindings("formContext");
    return super.preset(presets, Content);
  }

  /** Form state context; should be bound to a `UIFormContext` component */
  @managed
  formContext?: UIFormContext;
}

export namespace UIFormContextController {
  /** UIFormStateController presets type, for use with `Component.with` */
  export interface Presets {
    /** Form state object; should be bound to a `UIFormContext` component */
    formContext: UIFormContext;
  }
}
