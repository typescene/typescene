import {
  UIComponentEvent,
  UIComponentEventHandler,
  UIRenderable,
  UIRenderableConstructor,
} from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Slowdown factor at which scrolling will begin to snap */
const SNAP_SLOWDOWN = 0.75;

/** Event that is emitted when the user scrolls up or down in a `UIScrollContainer */
export class UIScrollEvent extends UIComponentEvent<UIScrollContainer> {
  /** Horizontal scrolling velocity (screen widths per second) */
  horizontalVelocity!: number;

  /** Horizontal scrolling velocity (screen heights per second) */
  verticalVelocity!: number;

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
export class UIScrollContainer extends UIContainer {
  static preset(
    presets: UIScrollContainer.Presets,
    ...components: Array<UIRenderableConstructor | undefined>
  ): Function {
    return super.preset(presets, ...components);
  }

  /** Create a new scroll container view component */
  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "scroll");
  }

  /** Padding around contained elements (in dp or CSS string, or separate offset values) */
  padding?: UIStyle.Offsets;

  /** Vertical scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
  verticalSnap?: "start" | "center" | "end";

  /** Horizontal scroll snap mode: `start` (snap to start of first 'mostly' visible component), `center` (snap container center to center of component closest to the center), or `end` (snap to end of last 'mostly' visible component) */
  horizontalSnap?: "start" | "center" | "end";

  /** Vertical threshold (in pixels) until which `UIScrollEvent.atTop` is set, defaults to 0 */
  topThreshold = 0;

  /** Vertical threshold (in pixels) until which `UIScrollEvent.atBottom` is set, defaults to 0 */
  bottomThreshold = 0;

  /** Horizontal threshold (in pixels) until which `UIScrollEvent.atLeft` is set, defaults to 0 */
  leftThreshold = 0;

  /** Horizontal threshold (in pixels) until which `UIScrollEvent.atRight` is set, defaults to 0 */
  rightThreshold = 0;

  /** True if vertical scrolling should be enabled, defaults to true */
  verticalScrollEnabled = true;

  /** True if horizontal scrolling should be enabled, defaults to true */
  horizontalScrollEnabled = true;

  /** Handle given scroll event to snap scroll position to content components; called automatically when the container is scrolled, but may be overridden */
  public handleScrollSnap(e: UIScrollEvent) {
    if (this.horizontalSnap || this.verticalSnap) {
      let vert = this._vertScrollState;
      let horz = this._horzScrollState;
      if (e.name === "ScrollEnd") {
        // reset all values
        vert.up = vert.down = false;
        horz.left = horz.right = false;
        vert.high = 0;
        horz.high = 0;
      } else {
        // update vertical state
        if ((e.scrolledUp && vert.up) || (e.scrolledDown && vert.down)) {
          if (e.verticalVelocity >= vert.velocity) {
            vert.slowing = 0;
            if (e.verticalVelocity > vert.high) vert.high = e.verticalVelocity;
          } else {
            vert.slowing++;

            // emit ScrollSnap* events which are picked up by the renderer
            // together with ScrollEnd to snap up/down
            if (vert.slowing > 1 && e.verticalVelocity < vert.high * SNAP_SLOWDOWN) {
              vert.slowing = vert.high = 0;
              if (vert.up && this.verticalSnap === "start") {
                this.emitAction("ScrollSnapUp", e);
              }
              if (vert.down && this.verticalSnap === "end") {
                this.emitAction("ScrollSnapDown", e);
              }
            }
          }
        } else {
          vert.slowing = 0;
          vert.high = 0;
        }
        vert.up = !!e.scrolledUp;
        vert.down = !!e.scrolledDown;
        vert.velocity = e.verticalVelocity;

        // update horizontal state
        if ((e.scrolledLeft && horz.left) || (e.scrolledRight && horz.right)) {
          if (e.horizontalVelocity >= horz.velocity) {
            horz.slowing = 0;
            if (e.horizontalVelocity > horz.high) horz.high = e.horizontalVelocity;
          } else {
            horz.slowing++;

            // emit ScrollSnap* events which are picked up by the renderer
            // together with ScrollEnd to snap left/right
            if (horz.slowing > 1 && e.horizontalVelocity < horz.high * SNAP_SLOWDOWN) {
              horz.slowing = horz.high = 0;
              // TODO: localize for RTL containers (?)
              if (horz.left && this.horizontalSnap === "start") {
                this.emitAction("ScrollSnapLeft", e);
              }
              if (horz.right && this.horizontalSnap === "end") {
                this.emitAction("ScrollSnapRight", e);
              }
            }
          }
        } else {
          horz.slowing = 0;
          horz.high = 0;
        }
        horz.left = !!e.scrolledLeft;
        horz.right = !!e.scrolledRight;
        horz.velocity = e.horizontalVelocity;
      }
    }
  }

  // keep track of scroll states, used above
  private _vertScrollState = {
    up: false,
    down: false,
    slowing: 0,
    high: 0,
    velocity: 0,
  };
  private _horzScrollState = {
    left: false,
    right: false,
    slowing: 0,
    high: 0,
    velocity: 0,
  };
}

// handle scroll snap using an event handler and the implementation method
UIScrollContainer.addEventHandler(function (e) {
  if (e instanceof UIScrollEvent) this.handleScrollSnap(e);
});

export namespace UIScrollContainer {
  /** UIScrollContainer presets type, for use with `Component.with` */
  export interface Presets extends UIContainer.Presets {
    /** Padding around contained elements (in dp or CSS string, or separate offset values) */
    padding?: UIStyle.Offsets;
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
