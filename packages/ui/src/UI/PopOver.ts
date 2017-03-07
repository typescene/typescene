import { Animation, Component, Container, TextLabelFactory } from "./";

/** Contains methods for displaying modal popovers */
export namespace PopOver {
    /** Display a popover containing given container, below given reference component */
    export function displayBelow(ref: Component, container: Container, options?: PopOver.Options) {
        /* implemented by platform dependent code */
    }

    /** Display a popover containing given container, above given reference component */
    export function displayAbove(ref: Component, container: Container, options: PopOver.Options) {
        /* implemented by platform dependent code */
    }

    /** Dismiss the popover currently on screen, if any */
    export function dismiss() {
        /* implemented by platform dependent code */
    }

    /** Contains popover display options */
    export interface Options {
        title?: string | TextLabelFactory;
        hideArrow?: boolean;
        animation?: Animation;
    }
}
