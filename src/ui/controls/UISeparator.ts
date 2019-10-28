import { Stringable } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Control that shows a horizontal or vertical separator */
export class UISeparator extends UIControl {
  static preset(presets: UISeparator.Presets) {
    return super.preset(presets);
  }

  constructor() {
    super();
    this.style = UITheme.current.baseControlStyle.mixin(
      UITheme.current.styles["separator"]
    );
  }

  /** Separator line thickness (in dp, or string with unit) */
  thickness: string | number = 1;

  /** Margin in the direction perpendicular to the separator (in dp, or string with unit) */
  margin?: string | number;

  /** Separator line color (`UIColor` or string), defaults to `@separator` */
  color: Stringable = "@separator";

  /** True if separator should be vertical instead of horizontal */
  vertical?: boolean;
}

export namespace UISeparator {
  /** UIDivider presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Separator line thickness (in dp, or string with unit) */
    thickness: string | number;
    /** Margin in the direction perpendicular to the separator (in dp, or string with unit), defaults to 0 */
    margin: string | number;
    /** Separator line color (`UIColor` or string), defaults to `@separator` */
    color?: Stringable;
    /** True if separator should be vertical instead of horizontal */
    vertical?: boolean;
  }
}
