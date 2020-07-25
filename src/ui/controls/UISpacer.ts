import { UITheme } from "../UITheme";
import { UIStyle } from "../UIStyle";
import { UIControl } from "./UIControl";

/** Control that has no content, but expands in both directions when needed */
export class UISpacer extends UIControl {
  static preset(presets: UISpacer.Presets) {
    if (presets.height) {
      let dimensions: UIStyle.Dimensions = presets.dimensions || (presets.dimensions = {});
      dimensions.minHeight = presets.height;
      presets.shrinkwrap = true;
    }
    if (presets.width) {
      let dimensions: UIStyle.Dimensions = presets.dimensions || (presets.dimensions = {});
      dimensions.minWidth = presets.width;
      presets.shrinkwrap = true;
    }
    return super.preset(presets);
  }

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
    this.style = UITheme.getStyle("control", "spacer");
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

export namespace UISpacer {
  /** UISpacer presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Spacer width (in dp or string with unit) */
    width: string | number;
    /** Spacer height (in dp or string with unit) */
    height: string | number;
  }
}
