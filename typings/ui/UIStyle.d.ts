/** Encapsulation of a set of styles to be applied to a UI component */
export declare class UIStyle {
    /** Create a new anonymous style set from scratch using given style objects */
    static create(styles?: Partial<UIStyle.StyleObjects>): UIStyle;
    /** Create a new style set from scratch using given style objects, with given name */
    static create(name: string, styles: Partial<UIStyle.StyleObjects>): UIStyle;
    /** Returns true if given object does *not* belong to an instance of `UIStyle` (i.e. overridden with a plain object) */
    static isStyleOverride<K extends keyof UIStyle.StyleObjects>(object: UIStyle.StyleObjects[K]): boolean;
    /** Create a new style set with given base style and (partial) style object(s), if any */
    constructor(name?: string, base?: UIStyle, ...styles: Partial<UIStyle.StyleObjects>[]);
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
    /** Returns a new style set that contains all current styles as well as the styles from given style set; the result is reused when the exact same style sets are mixed again */
    mixin(style: UIStyle): UIStyle;
    /** Returns a new style set that contains all current styles as well as given styles, with a new ID and optionally a new name */
    extend(objects: Partial<UIStyle.StyleObjects>, name?: string): UIStyle;
    /** Add or extend a conditional style with given style set */
    addState(name: keyof UIStyle.ConditionalStyles, objects: Partial<UIStyle.StyleObjects>): this;
    /** Returns all individual style objects as read-only objects */
    getStyles(): Readonly<UIStyle.StyleObjects>;
    /** Returns all styles that are unique to this instance, as read-only objects */
    getOwnStyles(): Partial<UIStyle.StyleObjects>;
    private _combined;
    private _styles;
}
export declare namespace UIStyle {
    /** Type definition for an object with conditional styles */
    interface ConditionalStyles {
        pressed?: UIStyle;
        hover?: UIStyle;
        focused?: UIStyle;
        disabled?: UIStyle;
        selected?: UIStyle;
    }
    /** Collection of individual objects that represent a (partial) style */
    interface StyleObjects {
        dimensions: Readonly<Dimensions>;
        position: Readonly<Position>;
        textStyle: Readonly<TextStyle>;
        controlStyle: Readonly<ControlStyle>;
        containerLayout: Readonly<ContainerLayout>;
    }
    /** Options for the dimensions of a UI component */
    interface Dimensions {
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
    interface Position {
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
    interface TextStyle {
        /** Text alignment (CSS) */
        align?: string;
        /** Text color (see `UITheme.replaceColor`) */
        color?: string;
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
        lineBreakMode?: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "ellipsis" | "clip" | "";
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
    /** Miscellaneous style options for control components, including all CSS attributes and classes */
    interface ControlStyle {
        /** Background style or color (see `UITheme.replaceColor`) */
        background?: string;
        /** Border style or color (see `UITheme.replaceColor`) */
        border?: string;
        /** Border radius (in dp or CSS string, defaults to 0) */
        borderRadius?: string | number;
        /** Drop shadow distance (0-1) */
        dropShadow?: number;
        /** Miscellaneous CSS attributes */
        css?: Partial<CSSStyleDeclaration>;
        /** Miscellaneous CSS class names */
        cssClassNames?: string[];
    }
    /** Options for layout of child components of a container component (only exists on `UIContainer` instances) */
    interface ContainerLayout {
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
    }
    /** Separator style, for use with `UIList` */
    interface SeparatorOptions {
        /** Separator type, defaults to line */
        type?: "line" | "spacer";
        /** Separator line color (see `UITheme.replaceColor`), defaults to `@separator` */
        color?: string;
        /** Separator thickness (CSS length or dp) */
        thickness?: string | number;
        /** Separator margin (CSS length or dp) */
        margin?: string | number;
    }
}
