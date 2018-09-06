import { UIComponentEvent, UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
/** Event that is emitted when the user scrolls up or down in a `UIScrollContainer */
export declare class UIScrollEvent extends UIComponentEvent {
    /** The source `UIScrollContainer` instance */
    source: UIScrollContainer;
    /** Horizontal scrolling velocity (screens widths per second) */
    horizontalVelocity: number;
    /** Horizontal scrolling velocity (screens heights per second) */
    verticalVelocity: number;
    /** True if (last) scrolled down */
    scrolledDown?: boolean;
    /** True if (last) scrolled up */
    scrolledUp?: boolean;
    /** True if (last) scrolled left */
    scrolledLeft?: boolean;
    /** True if (last) scrolled right */
    scrolledRight?: boolean;
    /** True if the `UIScrollContainer` is scrolled to the top */
    atTop?: boolean;
    /** True if the `UIScrollContainer` is scrolled to the bottom */
    atBottom?: boolean;
    /** True if the `UIScrollContainer` is scrolled to the left */
    atLeft?: boolean;
    /** True if the `UIScrollContainer` is scrolled to the right */
    atRight?: boolean;
}
/** Represents a UI component that contains other components and allows scrolling horizontally and/or vertically, and emits throttled scroll events (`Scroll` and `ScrollEnd`, see `UIScrollEvent`) */
export declare class UIScrollContainer extends UIContainer {
    static preset(presets: UIScrollContainer.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    /** Vertical scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
    verticalSnap?: "start" | "center" | "end";
    /** Horizontal scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
    horizontalSnap?: "start" | "center" | "end";
    /** Vertical threshold (in pixels) until which `UIScrollEvent.atTop` is set, defaults to 0 */
    topThreshold: number;
    /** Vertical threshold (in pixels) until which `UIScrollEvent.atBottom` is set, defaults to 0 */
    bottomThreshold: number;
    /** Horizontal threshold (in pixels) until which `UIScrollEvent.atLeft` is set, defaults to 0 */
    leftThreshold: number;
    /** Horizontal threshold (in pixels) until which `UIScrollEvent.atRight` is set, defaults to 0 */
    rightThreshold: number;
    /** True if vertical scrolling should be enabled, defaults to true */
    verticalScrollEnabled: boolean;
    /** True if horizontal scrolling should be enabled, defaults to true */
    horizontalScrollEnabled: boolean;
}
export declare namespace UIScrollContainer {
    /** UIScrollContainer presets type, for use with `Component.with` */
    interface Presets extends UIContainer.Presets {
        /** True if vertical scrolling should be enabled, defaults to true */
        verticalScrollEnabled?: boolean;
        /** True if horizontal scrolling should be enabled, defaults to true */
        horizontalScrollEnabled?: boolean;
        /** Vertical scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
        verticalSnap?: "start" | "center" | "end";
        /** Horizontal scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
        horizontalSnap?: "start" | "center" | "end";
        /** Vertical threshold (in pixels) until which `UIScrollEvent.atTop` is set, defaults to 0 */
        topThreshold?: number;
        /** Vertical threshold (in pixels) until which `UIScrollEvent.atBottom` is set, defaults to 0 */
        bottomThreshold?: number;
        /** Horizontal threshold (in pixels) until which `UIScrollEvent.atLeft` is set, defaults to 0 */
        leftThreshold?: number;
        /** Horizontal threshold (in pixels) until which `UIScrollEvent.atRight` is set, defaults to 0 */
        rightThreshold?: number;
        /** Event handler for Scroll events */
        onScroll?: UIComponentEventHandler;
        /** Event handler for ScrollEnd events */
        onScrollEnd?: UIComponentEventHandler;
    }
}
