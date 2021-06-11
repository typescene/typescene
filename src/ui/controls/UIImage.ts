import { Binding } from "../../core";
import { UIComponentEventHandler, Stringable } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIStyle } from "../UIStyle";
import { UIControl } from "./UIControl";

/** Represents a UI component that displays an image */
export class UIImage extends UIControl {
  /** Creates a preset image class with given URL and style, if any */
  static withUrl(url: Stringable | Binding, style?: string | UIStyle) {
    return this.with({ url, style });
  }

  static preset(presets: UIImage.Presets): Function {
    if (presets.allowKeyboardFocus) presets.allowFocus = presets.allowKeyboardFocus;
    return super.preset(presets);
  }

  /** Create a new label with given URL */
  constructor(url?: Stringable) {
    super();
    this.style = UITheme.getStyle("control", "image");
    if (url !== undefined) this.url = url;
  }

  isFocusable() {
    return !!(this.allowFocus || this.allowKeyboardFocus);
  }

  isKeyboardFocusable() {
    return !!this.allowKeyboardFocus;
  }

  /** True if this image may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
  allowFocus?: boolean;

  /** True if this image may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
  allowKeyboardFocus?: boolean;

  /** Image resource URL */
  url?: Stringable;
}

export namespace UIImage {
  /** UIImage presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Image resource URL */
    url?: Stringable;
    /** Set to true to allow this image to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
    allowFocus?: boolean;
    /** Set to true to allow this image to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
    allowKeyboardFocus?: boolean;
    /** Event handler that is invoked when an error occurs while loading the image resource */
    onLoadError?: UIComponentEventHandler;
  }
}
