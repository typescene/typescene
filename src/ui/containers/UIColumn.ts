import { UIRenderable, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Style mixin that is automatically applied on each instance */
const _mixin = UIStyle.create("UIColumn", {
  containerLayout: { axis: "vertical" },
  dimensions: { grow: 0, shrink: 0 },
});

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
    this.style = UITheme.current.baseContainerStyle.mixin(_mixin);
  }

  /** Returns true if spacing between components should be non-zero (used by renderer) */
  hasComponentSpacing() {
    return !!this.spacing;
  }

  /** Space between components along vertical axis (in dp or string with unit, defaults to 8) */
  spacing?: string | number = 8;

  /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
  width?: string | number;
}

/** Shortcut for `UIColumn` constructor with spacing preset to zero */
export let UICloseColumn = UIColumn.with({ spacing: 0 });

export namespace UIColumn {
  /** UIColumn presets type, for use with `Component.with` */
  export interface Presets extends UIContainer.Presets {
    /** Space between components along vertical axis (in dp or string with unit, defaults to 8) */
    spacing?: string | number;
    /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    width?: string | number;
  }
}
