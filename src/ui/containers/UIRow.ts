import { UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Represents a UI component that contains other components, in a horizontal arrangement */
export class UIRow extends UIContainer {
  static preset(
    presets: UIRow.Presets,
    ...rest: Array<UIRenderableConstructor | undefined>
  ): Function {
    return super.preset(presets, ...rest);
  }

  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "row");
  }

  /** Returns true if spacing between components should be non-zero (used by renderer) */
  hasComponentSpacing() {
    return !!this.spacing;
  }

  /** Space between components along horizontal axis (in dp or string with unit, defaults to value from `UITheme`); overrides `layout.separator` options */
  spacing?: string | number = UITheme.current.spacing;

  /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
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
    /** Space between components along horizontal axis (in dp or string with unit, defaults to value from `UITheme`); overrides `layout.separator` options */
    spacing?: string | number;
    /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    height?: string | number;
  }
}
