import * as Async from "@typescene/async";
import { Component, PointerEvent, TextLabelFactory } from "./";

/** Contains methods for displaying dropdown menus and context menus */
export namespace Menu {
    /** Display a modal context menu; returns a Promise that resolves to the index(base 1)/key of the selected menu item, or is rejected if the user cancels the context menu */
    export function displayContextMenu(options: Menu.Option[], event: PointerEvent):
        PromiseLike<string | number> {
        /* implemented by platform dependent code */
        throw new Error();
    }

    /** Display a modal dropdown menu below the given component (or above, depending on available screen space); returns a Promise that resolves to the index(base 1)/key of the selected menu item, or is rejected if the user cancels the context menu */
    export function displayDropdown(options: Menu.Option[], component: Component):
        PromiseLike<string | number> {
        /* implemented by platform dependent code */
        throw new Error();
    }

    /** Dismiss the menu currently on screen, if any */
    export function dismiss() {
        /* implemented by platform dependent code */
    }

    /** Represents a context/dropdown menu option or divider */
    export interface Option {
        /** Optional key (string) used as an identifier */
        key?: string;
        /** Menu item label text */
        label?: string | TextLabelFactory;
        /** Menu item icon */
        icon?: string;
        /** Menu item icon displayed on the far side, next to where a sub menu would open */
        sideIcon?: string;
        /** Set to true to disable this menu item */
        disabled?: boolean;
        /** Set to true (and leave other properties out) to display a divider instead of a menu option in this position */
        divider?: boolean;
        /** Sub menu options, displayed when this item is selected/focused */
        subMenu?: Option[];
    }
}
