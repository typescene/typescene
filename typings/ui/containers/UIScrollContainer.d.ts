import { UIComponentEvent, UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
export declare class UIScrollEvent extends UIComponentEvent {
    source: UIScrollContainer;
    horizontalVelocity: number;
    verticalVelocity: number;
    scrolledDown?: boolean;
    scrolledUp?: boolean;
    scrolledLeft?: boolean;
    scrolledRight?: boolean;
    atTop?: boolean;
    atBottom?: boolean;
    atLeft?: boolean;
    atRight?: boolean;
}
export declare class UIScrollContainer extends UIContainer {
    static preset(presets: UIScrollContainer.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    verticalSnap?: "start" | "center" | "end";
    horizontalSnap?: "start" | "center" | "end";
    topThreshold: number;
    bottomThreshold: number;
    leftThreshold: number;
    rightThreshold: number;
    verticalScrollEnabled: boolean;
    horizontalScrollEnabled: boolean;
}
export declare namespace UIScrollContainer {
    interface Presets extends UIContainer.Presets {
        verticalScrollEnabled?: boolean;
        horizontalScrollEnabled?: boolean;
        verticalSnap?: "start" | "center" | "end";
        horizontalSnap?: "start" | "center" | "end";
        topThreshold?: number;
        bottomThreshold?: number;
        leftThreshold?: number;
        rightThreshold?: number;
        onScroll?: UIComponentEventHandler;
        onScrollEnd?: UIComponentEventHandler;
    }
}
