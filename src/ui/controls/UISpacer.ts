import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Control that has no content, but expands in both directions when needed */
export class UISpacer extends UIControl {
  /** Creates a preset spacer class with given height (in dp or string with unit), shrinkwrapped by default */
  static withHeight(minHeight: string | number, shrinkwrap = true) {
    return this.with({ dimensions: { minHeight }, shrinkwrap });
  }

  /** Creates a preset spacer class with given width (in dp or string with unit), shrinkwrapped by default */
  static withWidth(minWidth: string | number, shrinkwrap = true) {
    return this.with({ dimensions: { minWidth }, shrinkwrap });
  }

  /** Create a new spacer with given (maximum) width and height */
  constructor(width?: string | number, height?: string | number, shrink?: boolean) {
    super();
    this.style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["spacer"]);
    this.shrinkwrap = false;
    if (width !== undefined || height !== undefined) {
      this.dimensions = {
        ...this.dimensions,
        width: width !== undefined ? width : this.dimensions.width,
        height: height !== undefined ? height : this.dimensions.height,
        grow: 0,
        shrink: shrink ? 1 : 0,
      };
      this.shrinkwrap = true;
    }
  }
}
