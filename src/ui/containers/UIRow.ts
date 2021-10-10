import { UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Represents a UI component that contains other components, in a horizontal arrangement */
export class UIRow extends UIContainer {
  static preset(
    presets: UIRow.Presets,
    ...components: Array<UIRenderableConstructor | undefined>
  ): Function {
    return super.preset(presets, ...components);
  }

  /** Create a new row view component */
  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "row");
  }

  /** Returns true if spacing between components should be non-zero (used by renderer) */
  hasComponentSpacing() {
    return !!this.spacing;
  }

  /** Space between components along horizontal axis (in dp or string with unit, defaults to value from `UITheme`) */
  spacing?: string | number = UITheme.current.spacing;

  /** Row height (in dp or string with unit) */
  height?: string | number;
}

/** Represents a row (see `UIRow`) with all components aligned to the right (or left for right-to-left cultures) */
export let UIOppositeRow = UIRow.with({ style: "row_opposite" });

/** Represents a row (see `UIRow`) with all components aligned in the center */
export let UICenterRow = UIRow.with({ style: "row_center" });

/** Shortcut for `UIRow` constructor with spacing preset to zero */
export let UICloseRow = UIRow.with({ spacing: 0 });

export namespace UIRow {
  /** UIRow presets type, for use with `Component.with` */
  export interface Presets extends UIContainer.Presets {
    /** Space between components along horizontal axis (in dp or string with unit, defaults to value from `UITheme`) */
    spacing?: string | number;
    /** Row height (in dp or string with unit) */
    height?: string | number;
  }
}
