import { UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Style mixin that is automatically applied on each instance */
const _mixin = UIStyle.create("UIRow", {
    containerLayout: { axis: "horizontal" },
    dimensions: { grow: 0, shrink: 0 }
});

/** Represents a UI component that contains other components, in a horizontal arrangement */
export class UIRow extends UIContainer {
    static preset(presets: UIRow.Presets,
        ...rest: Array<UIRenderableConstructor | undefined>): Function {
        return super.preset(presets, ...rest);
    }

    style = UITheme.current.baseContainerStyle.mixin(_mixin);

    /** Returns true if spacing between components should be non-zero (used by renderer) */
    hasComponentSpacing() { return !!this.spacing }

    /** Space between components along horizontal axis (in dp or string with unit, defaults to 8) */
    spacing?: string | number = 8;

    /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    height?: string | number;
}

/** Shortcut for `UIRow` constructor preset with styles to align all components to the right (or left for right-to-left cultures) */
export let UIOppositeRow = UIRow.with({
    style: UIStyle.create("row-opposite", {
        containerLayout: { distribution: "end" }
    })
});

/** Shortcut for `UIRow` constructor preset with styles to align all components in the center */
export let UICenterRow = UIRow.with({
    style: UIStyle.create("row-center", {
        containerLayout: { distribution: "center" }
    })
});

/** Shortcut for `UIRow` constructor with spacing preset to zero */
export let UICloseRow = UIRow.with({ spacing: 0 });

export namespace UIRow {
    /** UIRow presets type, for use with `Component.with` */
    export interface Presets extends UIContainer.Presets {
        /** Space between components along horizontal axis (in dp or string with unit, defaults to 16) */
        spacing?: string | number;
        /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
        height?: string | number;
    }
}
