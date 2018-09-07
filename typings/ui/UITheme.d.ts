import { UIRenderableConstructor, UITransitionType } from "./UIComponent";
import { UIStyle } from "./UIStyle";
export declare abstract class ConfirmationDialogBuilder {
    abstract setTitle(title: string): this;
    abstract addMessage(message: string): this;
    abstract setConfirmButtonLabel(label: string): this;
    abstract setCancelButtonLabel(label: string): this;
    abstract build(): UIRenderableConstructor;
}
export declare abstract class UIMenuBuilder {
    abstract clear(): this;
    abstract addOption(key: string, text: string, icon?: string, hint?: string, hintIcon?: string, textStyle?: Partial<UIStyle.TextStyle>, hintStyle?: Partial<UIStyle.TextStyle>): this;
    abstract addSelectionGroup(options: Array<{
        key: string;
        text: string;
    }>, selectedKey?: string, textStyle?: Partial<UIStyle.TextStyle>): this;
    abstract addSeparator(): this;
    abstract setGravity(gravity: "start" | "stretch" | "end"): this;
    abstract setRevealTransition(transition: UITransitionType): this;
    abstract setExitTransition(transition: UITransitionType): this;
    abstract build(): UIRenderableConstructor;
}
export declare class UITheme {
    static current: UITheme;
    static isBrightColor(color: string): boolean;
    static mixColors(color1: string, color2: string, p: number): string;
    static replaceColor(color: string): string;
    baseContainerStyle: UIStyle;
    baseControlStyle: UIStyle;
    modalDialogShadeOpacity: number;
    ConfirmationDialogBuilder?: new () => ConfirmationDialogBuilder;
    MenuBuilder?: new () => UIMenuBuilder;
    colors: {
        [name: string]: string;
    };
    addColor(name: string, color: string): this;
    icons: {
        [name: string]: string;
    };
    addIcon(name: string, icon: string): this;
    styles: {
        [name: string]: UIStyle;
    };
    addStyle(name: string, styles: Partial<UIStyle.StyleObjects>): this;
    addStyles(...styles: UIStyle[]): this;
}
