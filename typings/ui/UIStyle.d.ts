export declare class UIStyle {
    static create(styles?: Partial<UIStyle.StyleObjects>): UIStyle;
    static create(name: string, styles: Partial<UIStyle.StyleObjects>): UIStyle;
    static isStyleOverride<K extends keyof UIStyle.StyleObjects>(object: UIStyle.StyleObjects[K]): boolean;
    constructor(name?: string, base?: UIStyle, ...styles: Partial<UIStyle.StyleObjects>[]);
    readonly name: string;
    readonly id: string;
    readonly ids: ReadonlyArray<string>;
    readonly inherited: ReadonlyArray<UIStyle>;
    readonly conditionalStyles: UIStyle.ConditionalStyles;
    mixin(style: UIStyle): UIStyle;
    extend(objects: Partial<UIStyle.StyleObjects>, name?: string): UIStyle;
    addState(name: keyof UIStyle.ConditionalStyles, objects: Partial<UIStyle.StyleObjects>): this;
    getStyles(): Readonly<UIStyle.StyleObjects>;
    getOwnStyles(): Partial<UIStyle.StyleObjects>;
    private _combined;
    private _styles;
}
export declare namespace UIStyle {
    interface ConditionalStyles {
        pressed?: UIStyle;
        hover?: UIStyle;
        focused?: UIStyle;
        disabled?: UIStyle;
        selected?: UIStyle;
    }
    interface StyleObjects {
        dimensions: Readonly<Dimensions>;
        position: Readonly<Position>;
        textStyle: Readonly<TextStyle>;
        controlStyle: Readonly<ControlStyle>;
        containerLayout: Readonly<ContainerLayout>;
    }
    interface Dimensions {
        width?: string | number;
        height?: string | number;
        minWidth?: string | number;
        maxWidth?: string | number;
        minHeight?: string | number;
        maxHeight?: string | number;
        grow?: number;
        shrink?: number;
    }
    interface Position {
        gravity?: "start" | "end" | "center" | "stretch" | "baseline" | "overlay" | "";
        top?: string | number;
        bottom?: string | number;
        left?: string | number;
        right?: string | number;
    }
    interface TextStyle {
        align?: string;
        color?: string;
        fontFamily?: string;
        fontSize?: string | number;
        fontWeight?: string | number;
        letterSpacing?: string | number;
        lineHeight?: string | number;
        lineBreakMode?: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "ellipsis" | "clip" | "";
        bold?: boolean;
        italic?: boolean;
        uppercase?: boolean;
        smallCaps?: boolean;
        underline?: boolean;
        strikeThrough?: boolean;
    }
    interface ControlStyle {
        background?: string;
        border?: string;
        borderRadius?: string | number;
        dropShadow?: number;
        css?: Partial<CSSStyleDeclaration>;
        cssClassNames?: string[];
    }
    interface ContainerLayout {
        axis?: "horizontal" | "vertical" | "";
        distribution?: "start" | "end" | "center" | "fill" | "space-around" | "";
        gravity?: "start" | "end" | "center" | "stretch" | "baseline" | "";
        wrapContent?: boolean;
        clip?: boolean;
    }
    interface SeparatorOptions {
        type?: "line" | "spacer";
        color?: string;
        thickness?: string | number;
        margin?: string | number;
    }
}
