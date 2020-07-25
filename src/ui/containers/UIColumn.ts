import { UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Represents a UI component that contains other components, in a vertical arrangement */
export class UIColumn extends UIContainer {
  static preset(
    presets: UIColumn.Presets,
    ...rest: Array<UIRenderableConstructor | undefined>
  ): Function {
    return super.preset(presets, ...rest);
  }

  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "column");
  }

  /** Returns true if spacing between components should be non-zero (used by renderer) */
  hasComponentSpacing() {
    return !!this.spacing;
  }

  /** Space between components along vertical axis (in dp or string with unit, defaults to value from `UITheme`); overrides `layout.separator` options */
  spacing?: string | number = UITheme.current.spacing;

  /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
  width?: string | number;
}

/** Shortcut for `UIColumn` constructor with spacing preset to zero */
export let UICloseColumn = UIColumn.with({ spacing: 0 });

export namespace UIColumn {
  /** UIColumn presets type, for use with `Component.with` */
  export interface Presets extends UIContainer.Presets {
    /** Space between components along vertical axis (in dp or string with unit, defaults to value from `UITheme`); overrides `layout.separator` options */
    spacing?: string | number;
    /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    width?: string | number;
  }
}
