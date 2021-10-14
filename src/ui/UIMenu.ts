import { component, Component, ComponentEventHandler, delegateEvents } from "../core";
import { err, ERROR } from "../errors";
import { Stringable, UIComponent, UIComponentEvent, UIRenderable } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
import { UIMenuBuilder, UITheme } from "./UITheme";

/** Event that is emitted on a menu or menu item when it is selected. */
export class UIMenuItemSelectedEvent extends UIComponentEvent {
  constructor(name: string, source: UIComponent, key: string) {
    super(name, source);
    this.key = key;
  }

  /** The key of the menu item that was selected */
  readonly key: string;
}

/** Represents a menu that can be displayed on screen. The menu itself is built up dynamically using a platform dependent builder class. Commonly, this class is used as a preset within a `UIModalController`. */
export class UIMenu extends Component implements UIRenderable {
  static preset(presets: UIMenu.Presets): Function {
    return super.preset(presets);
  }

  /** Create a new renderable menu; should not be called directly */
  constructor() {
    super();
    if (!UITheme.current.MenuBuilder) {
      throw err(ERROR.UIMenu_NoBuilder);
    }
    this.builder = new UITheme.current.MenuBuilder();
  }

  /** Menu builder, can be used to build up the menu before it is displayed, e.g. when handing the Build event */
  readonly builder: UIMenuBuilder;

  /** Build the current menu and render it using `UIMenu.builder` */
  render(callback: UIRenderContext.RenderCallback) {
    if (this.options.length) {
      this.builder.clear();
      for (let option of this.options) {
        this.builder.addOption(option.key, String(option.text));
      }
    }
    if (this.gravity) this.builder.setGravity(this.gravity);
    this.emitAction("Build");
    let Menu = this.builder.build();
    (this.menu = new Menu()).render(callback);
  }

  /** Handle SelectMenuItem events by setting the `selected` property to the key of the selected item, and then propagating the event on this component itself. */
  protected onSelectMenuItem(e: UIMenuItemSelectedEvent): boolean | void {
    this.selected = e.key;
    this.emit(e);
    return true;
  }

  /** The last menu that was built, as a child object */
  @delegateEvents
  @component
  menu?: UIRenderable;

  /** Menu gravity in relation to reference component (start/stretch/end) */
  gravity?: "start" | "stretch" | "end";

  /** List of initial menu options; for advanced menus use `onBuild` to build the menu dynamically */
  options: Array<{ key: string; text: Stringable }> = [];

  /** The key of the menu item that was last selected, if any */
  selected?: string;
}

export namespace UIMenu {
  /** UIMenu presets type, for use with `Component.with` */
  export interface Presets {
    /** List of menu options; for advanced menus use `onBuild` to build the menu dynamically */
    options: Array<{ key: string; text: Stringable }>;
    /** Menu gravity in relation to reference component (start/stretch/end) */
    gravity: "start" | "stretch" | "end";
    /** Event handler that is invoked every time just before the menu is rendered */
    onBuild: ComponentEventHandler<UIMenu>;
    /** Event handler that is invoked after a menu item has been picked */
    onSelectMenuItem: ComponentEventHandler<UIMenu, UIMenuItemSelectedEvent>;
  }
}
