import { Stringable } from "./UIComponent";

/** Next UID for a `UIStyle` object */
let _nextUID = 1;

/** All mixins created, by ID */
let _mixins: { [id: string]: UIStyle } = Object.create(null);

/** Inherited style object, composed from one or more other objects */
class InheritedStyleObject<T, K extends string> {
  constructor(base?: { [p in K]: T }, objects?: { [p in K]?: T }[], key?: K) {
    this._inherit = key && objects ? objects.map(o => o[key]).filter(a => !!a) : [];
    if (key && base && base[key]) this._inherit.unshift(base[key]);
  }
  protected _value(propertyName: keyof T) {
    let value: any;
    for (let i = this._inherit.length - 1; i >= 0; i--) {
      value = this._inherit[i][propertyName];
      if (value !== undefined) break;
    }
    return value;
  }
  protected _inherit: any[];
}
class InheritedDimensions extends InheritedStyleObject<UIStyle.Dimensions, "dimensions"> {
  static create(
    base?: { dimensions: UIStyle.Dimensions },
    objects?: { dimensions?: UIStyle.Dimensions }[]
  ) {
    let o = new this(base, objects, "dimensions");
    Object.defineProperties(o, {
      width: { enumerable: true, get: o._value.bind(o, "width") },
      height: { enumerable: true, get: o._value.bind(o, "height") },
      minWidth: { enumerable: true, get: o._value.bind(o, "minWidth") },
      maxWidth: { enumerable: true, get: o._value.bind(o, "maxWidth") },
      minHeight: { enumerable: true, get: o._value.bind(o, "minHeight") },
      maxHeight: { enumerable: true, get: o._value.bind(o, "maxHeight") },
      grow: { enumerable: true, get: o._value.bind(o, "grow") },
      shrink: { enumerable: true, get: o._value.bind(o, "shrink") },
    });
    return o as UIStyle.Dimensions;
  }
}
class InheritedPosition extends InheritedStyleObject<UIStyle.Position, "position"> {
  static create(
    base?: { position: UIStyle.Position },
    objects?: { position?: UIStyle.Position }[]
  ) {
    let o = new this(base, objects, "position");
    Object.defineProperties(o, {
      gravity: { enumerable: true, get: o._value.bind(o, "gravity") },
      top: { enumerable: true, get: o._value.bind(o, "top") },
      bottom: { enumerable: true, get: o._value.bind(o, "bottom") },
      left: { enumerable: true, get: o._value.bind(o, "left") },
      right: { enumerable: true, get: o._value.bind(o, "right") },
    });
    return o as UIStyle.Position;
  }
}
class InheritedTextStyle extends InheritedStyleObject<UIStyle.TextStyle, "textStyle"> {
  static create(
    base?: { textStyle: UIStyle.TextStyle },
    objects?: { textStyle?: UIStyle.TextStyle }[]
  ) {
    let o = new this(base, objects, "textStyle");
    Object.defineProperties(o, {
      align: { enumerable: true, get: o._value.bind(o, "align") },
      color: { enumerable: true, get: o._value.bind(o, "color") },
      fontFamily: { enumerable: true, get: o._value.bind(o, "fontFamily") },
      fontSize: { enumerable: true, get: o._value.bind(o, "fontSize") },
      fontWeight: { enumerable: true, get: o._value.bind(o, "fontWeight") },
      letterSpacing: { enumerable: true, get: o._value.bind(o, "letterSpacing") },
      lineHeight: { enumerable: true, get: o._value.bind(o, "lineHeight") },
      lineBreakMode: { enumerable: true, get: o._value.bind(o, "lineBreakMode") },
      bold: { enumerable: true, get: o._value.bind(o, "bold") },
      italic: { enumerable: true, get: o._value.bind(o, "italic") },
      uppercase: { enumerable: true, get: o._value.bind(o, "uppercase") },
      smallCaps: { enumerable: true, get: o._value.bind(o, "smallCaps") },
      underline: { enumerable: true, get: o._value.bind(o, "underline") },
      strikeThrough: { enumerable: true, get: o._value.bind(o, "strikeThrough") },
    });
    return o as UIStyle.TextStyle;
  }
}
class InheritedDecoration extends InheritedStyleObject<UIStyle.Decoration, "decoration"> {
  static create(
    base?: { decoration: UIStyle.Decoration },
    objects?: { decoration?: UIStyle.Decoration }[]
  ) {
    let o = new this(base, objects, "decoration");
    Object.defineProperties(o, {
      background: { enumerable: true, get: o._value.bind(o, "background") },
      textColor: { enumerable: true, get: o._value.bind(o, "textColor") },
      border: { enumerable: true, get: o._value.bind(o, "border") },
      borderColor: { enumerable: true, get: o._value.bind(o, "borderColor") },
      borderStyle: { enumerable: true, get: o._value.bind(o, "borderStyle") },
      borderThickness: { enumerable: true, get: o._value.bind(o, "borderThickness") },
      borderRadius: { enumerable: true, get: o._value.bind(o, "borderRadius") },
      padding: { enumerable: true, get: o._value.bind(o, "padding") },
      dropShadow: { enumerable: true, get: o._value.bind(o, "dropShadow") },
      opacity: { enumerable: true, get: o._value.bind(o, "opacity") },
      css: {
        enumerable: true,
        get: function (this: InheritedDecoration) {
          let result: any = Object.create(null);
          for (let i = 0; i < this._inherit.length; i++) {
            let css: Partial<CSSStyleDeclaration> = this._inherit[i].css;
            if (!css) continue;
            for (let p in css) result[p] = css[p];
          }
          return result;
        },
      },
      cssClassNames: {
        enumerable: true,
        get: function (this: InheritedDecoration) {
          let seen: { [name: string]: true } = Object.create(null);
          for (let i = this._inherit.length - 1; i >= 0; i--) {
            let names: string[] | string | undefined = this._inherit[i].cssClassNames;
            if (!names) continue;
            if (typeof names === "string") seen[names] = true;
            else for (let p of names) seen[p] = true;
          }
          return Object.keys(seen);
        },
      },
    });
    return o as UIStyle.Decoration;
  }
}
class InheritedContainerLayout extends InheritedStyleObject<
  UIStyle.ContainerLayout,
  "containerLayout"
> {
  static create(
    base?: { containerLayout: UIStyle.ContainerLayout },
    objects?: { containerLayout?: UIStyle.ContainerLayout }[]
  ) {
    let o = new this(base, objects, "containerLayout");
    Object.defineProperties(o, {
      axis: { enumerable: true, get: o._value.bind(o, "axis") },
      distribution: { enumerable: true, get: o._value.bind(o, "distribution") },
      gravity: { enumerable: true, get: o._value.bind(o, "gravity") },
      wrapContent: { enumerable: true, get: o._value.bind(o, "wrapContent") },
      clip: { enumerable: true, get: o._value.bind(o, "clip") },
      separator: { enumerable: true, get: o._value.bind(o, "separator") },
    });
    return o as UIStyle.ContainerLayout;
  }
}

/** Empty style object, to be reused for styles with no properties */
let _emptyStyleObject = Object.freeze(new InheritedStyleObject());

/** Encapsulation of a set of styles to be applied to a UI component */
export class UIStyle {
  /** Create a new anonymous style set from scratch using given style objects */
  static create(styles?: Partial<UIStyle.StyleObjects>): UIStyle;
  /** Create a new style set from scratch using given style objects, with given name */
  static create(name: string, styles: Partial<UIStyle.StyleObjects>): UIStyle;
  static create(name: any, styles: any = name) {
    if (typeof name !== "string") name = "UIStyle_" + _nextUID++;
    return new UIStyle(name, undefined, styles || Object.create(null));
  }

  /** Returns true if given object does *not* belong to an instance of `UIStyle` (i.e. overridden with a plain object) */
  static isStyleOverride<K extends keyof UIStyle.StyleObjects>(
    object: UIStyle.StyleObjects[K]
  ) {
    return object && !(object instanceof InheritedStyleObject);
  }

  /** Create a new style set with given base style and (partial) style object(s), if any */
  constructor(name = "", base?: UIStyle, ...styles: Partial<UIStyle.StyleObjects>[]) {
    this.name = name;
    this.id = "S_" + (name ? name.replace(/[^\w\d_\-]/g, "") + "--" : "") + _nextUID++;
    this.ids = base ? [...base.ids, this.id] : [this.id];
    if (base) this.conditionalStyles = { ...base.conditionalStyles };
    else this.conditionalStyles = Object.create(null);
    if (!base && !styles.length) {
      // initialize an empty instance
      this.inherited = [];
      this._styles = Object.freeze(Object.create(null));
      this._combined = Object.freeze({
        dimensions: _emptyStyleObject,
        position: _emptyStyleObject,
        textStyle: _emptyStyleObject,
        decoration: _emptyStyleObject,
        containerLayout: _emptyStyleObject,
      });
    } else {
      // merge given styles
      this.inherited = (base && [...base.inherited, base]) || [];
      let baseStyles = base && base.getStyles();
      this._styles = Object.freeze({
        dimensions: InheritedDimensions.create(undefined, styles),
        position: InheritedPosition.create(undefined, styles),
        textStyle: InheritedTextStyle.create(undefined, styles),
        decoration: InheritedDecoration.create(undefined, styles),
        containerLayout: InheritedContainerLayout.create(undefined, styles),
      });
      this._combined = Object.freeze({
        dimensions: InheritedDimensions.create(baseStyles, styles),
        position: InheritedPosition.create(baseStyles, styles),
        textStyle: InheritedTextStyle.create(baseStyles, styles),
        decoration: InheritedDecoration.create(baseStyles, styles),
        containerLayout: InheritedContainerLayout.create(baseStyles, styles),
      });
    }
  }

  /** Human readable name for this style */
  readonly name: string;

  /** Arbitrary ID for this style, contains sanitized `name` token */
  readonly id: string;

  /** List of IDs which includes the current ID as well as inherited IDs */
  readonly ids: ReadonlyArray<string>;

  /** List of inherited styles */
  readonly inherited: ReadonlyArray<UIStyle>;

  /** Referenced conditional styles (should be added using `UIStyle.addState`) */
  readonly conditionalStyles: UIStyle.ConditionalStyles;

  /** Returns a new style set that contains all current styles as well as the styles from given `UIStyle` instance; the result is reused when the exact same style sets are mixed again */
  mixin(style: UIStyle) {
    if (!style) return this;
    let id = this.id + "+" + style.id;
    if (_mixins[id]) return _mixins[id];
    let result = new UIStyle(this.name + "--" + style.name, this, style._combined);
    for (let cond in style.conditionalStyles) {
      if (style.conditionalStyles[cond as keyof UIStyle.ConditionalStyles]) {
        result.conditionalStyles[cond as keyof UIStyle.ConditionalStyles] =
          style.conditionalStyles[cond as keyof UIStyle.ConditionalStyles];
      }
    }
    _mixins[id] = result;
    return result;
  }

  /** Returns a new style set that contains all current styles as well as given styles (objects), with a new ID and optionally a new name. Creates a new instance each time, unlike `mixin`. */
  extend(objects: Partial<UIStyle.StyleObjects>, name?: string) {
    return new UIStyle(name || this.name, this, objects);
  }

  /** Add or extend a conditional style with given style set */
  addState(name: keyof UIStyle.ConditionalStyles, objects: Partial<UIStyle.StyleObjects>) {
    if (!this.conditionalStyles[name]) {
      this.conditionalStyles[name] = UIStyle.create(this.name + ":" + name, objects);
    } else {
      this.conditionalStyles[name] = this.conditionalStyles[name]!.extend(objects);
    }
    return this;
  }

  /** Returns all individual style objects as read-only objects */
  getStyles() {
    return this._combined;
  }

  /** Returns all styles that are unique to this instance, as read-only objects */
  getOwnStyles() {
    return this._styles;
  }

  private _combined: Readonly<UIStyle.StyleObjects>;
  private _styles: Partial<UIStyle.StyleObjects>;
}

export namespace UIStyle {
  /** Type definition for padding, margin, or border measurements */
  export type Offsets =
    | string
    | number
    | {
        x?: string | number;
        y?: string | number;
        top?: string | number;
        bottom?: string | number;
        left?: string | number;
        right?: string | number;
      };

  /** Type definition for an object with conditional styles */
  export interface ConditionalStyles {
    pressed?: UIStyle;
    hover?: UIStyle;
    focused?: UIStyle;
    disabled?: UIStyle;
    selected?: UIStyle;
  }

  /** Collection of individual objects that represent a (partial) style */
  export interface StyleObjects {
    /** Options for the dimensions of a UI component */
    dimensions: Readonly<Dimensions>;
    /** Options for component positioning within parent component(s) */
    position: Readonly<Position>;
    /** Options for styles of a UI component that shows text */
    textStyle: Readonly<TextStyle>;
    /** Options for the appearance of UI components, including miscellaneous CSS attributes and class names */
    decoration: Readonly<Decoration>;
    /** Options for layout of child components of a container component */
    containerLayout: Readonly<ContainerLayout>;
  }

  /** Options for the dimensions of a UI component */
  export interface Dimensions {
    /** Outer width of the element, as specified (in dp or string with unit) */
    width?: string | number;
    /** Outer height of the element, as specified (in dp or string with unit) */
    height?: string | number;
    /** Minimum width of the element, as specified (in dp or string with unit) */
    minWidth?: string | number;
    /** Maximum width of the element, as specified (in dp or string with unit) */
    maxWidth?: string | number;
    /** Minimum height of the element, as specified (in dp or string with unit) */
    minHeight?: string | number;
    /** Maximum height of the element, as specified (in dp or string with unit) */
    maxHeight?: string | number;
    /** Growth quotient (0 for no growth, higher values for faster growth when needed) */
    grow?: number;
    /** Shrink quotient (0 to never shrink, higher values for faster shrinking when needed) */
    shrink?: number;
  }

  /** Options for component positioning within parent component(s) */
  export interface Position {
    /** Position of the component in the direction perpendicular to the distribution axis of the parent component, or `overlay` if the component should be placed on top of other components (i.e. CSS absolute positioning) */
    gravity?: "start" | "end" | "center" | "stretch" | "baseline" | "overlay" | "";
    /** Top anchor: relative distance, or absolute position if `gravity` is 'overlay' (in dp or string with unit, defaults to `auto`) */
    top?: string | number;
    /** Bottom anchor: relative distance, or absolute position if `gravity` is 'overlay' (in dp or string with unit, defaults to `auto`) */
    bottom?: string | number;
    /** Left anchor: relative distance, or absolute position if `gravity` is 'overlay' (in dp or string with unit, defaults to `auto`) */
    left?: string | number;
    /** Right anchor: relative distance, or absolute position if `gravity` is 'overlay' (in dp or string with unit, defaults to `auto`) */
    right?: string | number;
  }

  /** Options for styles of a UI component that shows text */
  export interface TextStyle {
    /** Text alignment (CSS) */
    align?: string;
    /** Text color (`UIColor` or string) */
    color?: Stringable;
    /** Font family (CSS) */
    fontFamily?: string;
    /** Font size (dp or string with unit) */
    fontSize?: string | number;
    /** Font weight (CSS) */
    fontWeight?: string | number;
    /** Letter spacing (dp or string with unit) */
    letterSpacing?: string | number;
    /** Line height (CSS relative to font size, *not* in dp) */
    lineHeight?: string | number;
    /** Line break handling mode (CSS white-space) */
    lineBreakMode?:
      | "normal"
      | "nowrap"
      | "pre"
      | "pre-wrap"
      | "pre-line"
      | "ellipsis"
      | "clip"
      | "";
    /** True for bold text (overrides `fontWeight` value) */
    bold?: boolean;
    /** True for italic text */
    italic?: boolean;
    /** True for all-uppercase text */
    uppercase?: boolean;
    /** True for text using small caps */
    smallCaps?: boolean;
    /** True for underlined text */
    underline?: boolean;
    /** True for struck trough text */
    strikeThrough?: boolean;
  }

  /** Options for the appearance of UI components, including miscellaneous CSS attributes and class names */
  export interface Decoration {
    /** Background style or color (`UIColor` or string) */
    background?: Stringable;
    /** Text color (`UIColor` or string); this may be overridden by `UIStyle.TextStyle.color` if specified on the same component or a child component */
    textColor?: Stringable;
    /** Border properties (CSS string) @deprecated */
    border?: Stringable;
    /** Border color (`UIColor` or string) */
    borderColor?: Stringable;
    /** Border style (CSS), defaults to "solid" */
    borderStyle?: string;
    /** Border thickness (in dp or CSS string, or separate offset values) */
    borderThickness?: Offsets;
    /** Border radius (in dp or CSS string) */
    borderRadius?: string | number;
    /** Padding within control element (in dp or CSS string, or separate offset values) */
    padding?: Offsets;
    /** Drop shadow distance (0-1) */
    dropShadow?: number;
    /** Opacity (0-1) */
    opacity?: number;
    /** Miscellaneous CSS attributes */
    css?: Partial<CSSStyleDeclaration>;
    /** Miscellaneous CSS class names (array) */
    cssClassNames?: string[];
  }

  /** Options for layout of child components of a container component (only exists on `UIContainer` instances) */
  export interface ContainerLayout {
    /** Axis along which content is distributed (defaults to vertical) */
    axis?: "horizontal" | "vertical" | "";
    /** Positioning of content along the distribution axis (defaults to start) */
    distribution?: "start" | "end" | "center" | "fill" | "space-around" | "";
    /** Positioning of content perpendicular to the distribution axis (defaults to stretch) */
    gravity?: "start" | "end" | "center" | "stretch" | "baseline" | "";
    /** True if content should wrap to new line/column if needed (defaults to false) */
    wrapContent?: boolean;
    /** True if content should be clipped within this container */
    clip?: boolean;
    /** Options for separator between each component */
    separator?: Readonly<SeparatorOptions>;
  }

  /** Separator style, for use with containers and lists */
  export interface SeparatorOptions {
    /** True for vertical line, or width-only spacer */
    vertical?: boolean;
    /** Width/height of separator space (CSS length or dp) */
    space?: string | number;
    /** Separator line thickness (CSS length or dp) */
    lineThickness?: string | number;
    /** Line separator color (`UIColor` or string), defaults to `@separator` */
    lineColor?: Stringable;
    /** Line separator margin (CSS length or dp) */
    lineMargin?: string | number;
  }
}
