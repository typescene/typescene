import * as Async from "@typescene/async";
import { Animation } from "../../Animation";
import { Style } from "../../Style";
import { Container } from "../";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { ComponentSignalHandler, ComponentSignal,  PointerEventSignal,   PointerHandler } from "../ComponentSignal";
import { Menu } from "../../Menu";
import { PopOver } from "../../PopOver";
import { TextLabelFactory } from "../TextLabelFactory";
import { ControlElement } from "./ControlElement";

/** Represents a button control */
export class Button extends ControlElement {
    /** Create a button control element */
    constructor(label: string | TextLabelFactory = "", icon?: string) {
        super();
        this.label = <any>label;
        this.icon = icon;

        // connect to Click signal to show dropdown and/or activate target
        this.Click.connect(() => {
            if (this.dropdown && this.dropdown.length) {
                // create menu and display, then emit signal on selection
                Menu.displayDropdown(this.dropdown, this)
                    .then(choice => this.DropdownClicked(choice));
            }
            else if (this.popover instanceof Function) {
                // create popover and display above/below button itself
                if (this.popoverAbove)
                    PopOver.displayAbove(this, new this.popover(), {
                        title: this.popoverTitle,
                        animation: this.popoverAnimation
                    });
                else
                    PopOver.displayBelow(this, new this.popover(), {
                        title: this.popoverTitle,
                        animation: this.popoverAnimation
                    });
            }
            else if (this.target) {
                // activate given target
                new Button.Activation().activate(this.target);
            }
        });
    }

    /** Initialize a button control factory with given label and handler */
    public static withLabel<T extends Button>(
        this: { new (): T, with: typeof Button.with },
        label: UIValueOrAsync<string | TextLabelFactory>,
        clickedHandler?: string | PointerHandler) {
        return this.with({ label, Clicked: clickedHandler });
    }

    /** Initialize a button control factory with given icon and handler */
    public static withIcon<T extends Button>(
        this: { new (): T, with: typeof Button.with },
        icon: UIValueOrAsync<string>,
        clickedHandler?: string | PointerHandler) {
        return this.with({ label: "", icon, Clicked: clickedHandler });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Button.Initializer) => this;

    /** Button label (observed) */
    @Async.observable_string
    public label: string;

    /** Optional icon (see `Label#icon`; observed) */
    @Async.observable
    public icon?: string;

    /** Optional icon to be appended after the label text (observed) */
    @Async.observable
    public iconAfter?: string;

    /** Space reserved for icon (rem units), if > 0 (observed) */
    @Async.observable
    public remGutter?: number;

    /** Optional badge text (see `Label#badge`; observed) */
    @Async.observable_string
    public badge: string;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;

    /** Disabled state (observed) */
    @Async.observable
    public disabled: boolean;

    /** Set to true to enable Bootstrap style "primary" class */
    @Async.observable
    public primary: boolean;

    /** Dropdown menu options to be displayed when this button is clicked (optional); defaults to undefined, set to array or ObservableArray to enable */
    @Async.observable
    public dropdown?: Menu.Option[];

    /** Container class or container factory for the contents of a popover to be displayed when this button is clicked (optional) */
    @Async.observable
    public popover?: typeof Container | ComponentFactory<Container>;

    /** Set to true to open popover above this button (vertically) when this button is clicked */
    @Async.observable
    public popoverAbove: boolean;

    /** Title of the popover (optional) displayed when this button is clicked; no title is displayed if this string is undefined or empty */
    @Async.observable_string
    public popoverTitle: string;

    /** Animation to be used for display of a popover */
    public popoverAnimation: Animation;

    /** URL/path string, or (App module) `Activity` instance or `Activity` class that will be activated when this button is clicked (optional) */
    @Async.observable
    public target: any;

    /** Set to false to expand horizontally within row (observed) */
    public shrinkwrap = true;

    /** Encapsulation of button element style (observed) */
    @Async.observable_not_null
    public readonly style_button = new Style();

    /** Signal emitted when a dropdown option has been selected */
    public readonly DropdownClicked = this.defineComponentSignal(Button.DropdownClickSignal);
}

export namespace Button {
    /** Signal that is emitted when a dropdown item has been selected */
    export class DropdownClickSignal extends ComponentSignal<string | number>{ }

    /** Contains injectable method for activating targets; instantiated by `Button` */
    export class Activation {
        /** Injectable method to activate given target (e.g. URL, or Activity instance or class); default ony handles URLs, `Application` instance injects more functionality here */
        @Async.injectable
        public activate(target: any) { /* ignore */ }
    }

    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: label text */
        label?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: icon (before label) */
        icon?: UIValueOrAsync<string>;
        /** Property initializer: icon (after label) */
        iconAfter?: UIValueOrAsync<string>;
        /** Property initializer: space reserved for icon (rem units) */
        remGutter?: UIValueOrAsync<number>;
        /** Property initializer: badge text */
        badge?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: true to disable the button */
        disabled?: UIValueOrAsync<boolean>;
        /** Property initializer: true to display as primary button */
        primary?: UIValueOrAsync<boolean>;
        /** Property initializer: dropdown items */
        dropdown?: UIValueOrAsync<Menu.Option[]>;
        /** Property initializer: popover content (container) */
        popover?: UIValueOrAsync<ComponentFactory<Container> | typeof Container>;
        /** Property initializer: true to display popover above button */
        popoverAbove?: UIValueOrAsync<boolean>;
        /** Property initializer: popover title text */
        popoverTitle?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: popover animation (appear) */
        popoverAnimation?: Animation;
        /** Property initializer: target URL, or Activity instance/class */
        target?: any;
        /** Property initializer: button style */
        style_button?: UIValueOrAsync<Style | Style.StyleSet>;
        /** Signal initializer: method name or handler */
        DropdownClicked?: string | ButtonDropdownClickHandler;
    }
}

/** Constructor for a button dropdown click event handler */
export class ButtonDropdownClickHandler
    extends ComponentSignalHandler<string | number, typeof Button.DropdownClickSignal> { }

/** Primary button control (shortcut for setting `.primary` on regular `Button` class) */
export class PrimaryButton extends Button {
    public primary = true;
}

/** Button that switches between selected (active) and deselected (inactive) when clicked (shortcut for setting `toggleMode` on regular `Button` class) */
export class ToggleButton extends Button {
    constructor(label: string | TextLabelFactory = "", icon?: string) {
        super(label, icon);
        this.selectionMode = Component.SelectionMode.Toggle;
    }
}

/** Link-styled button control ("btn-link" class) */
export class LinkButton extends Button {
    // implemented by platform dependent renderer
}

/** Button control that is not decorated as a button */
export class TextButton extends Button {
    // implemented by platform dependent renderer
}

/** Round button control (e.g. with an icon) */
export class RoundButton extends Button {
    // implemented by platform dependent renderer
}
