import { Component } from "../core";
import { UIComponent, UIComponentEvent, UIComponentEventHandler, UIRenderable } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
import { UIMenuBuilder } from "./UITheme";
export declare class UIMenuItemSelectedEvent extends UIComponentEvent {
    constructor(name: string, source: UIComponent, key: string);
    readonly key: string;
}
export declare class UIMenu extends Component {
    static preset(presets: UIMenu.Presets): Function;
    constructor();
    readonly builder: UIMenuBuilder;
    render(callback: UIRenderContext.RenderCallback): void;
    menu?: UIRenderable;
    gravity?: "start" | "stretch" | "end";
    options: Array<{
        key: string;
        text: string;
    }>;
    selected?: string;
}
export declare namespace UIMenu {
    interface Presets {
        options: Array<{
            key: string;
            text: string;
        }>;
        gravity: "start" | "stretch" | "end";
        onBuild: UIComponentEventHandler<UIMenu>;
        onSelectMenuItem: UIComponentEventHandler<UIMenu, UIMenuItemSelectedEvent>;
    }
}
