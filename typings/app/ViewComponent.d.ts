import { ManagedRecord } from "../core";
import { UIRenderable, UIRenderableConstructor, UIRenderContext } from "../ui";
import { AppComponent } from "./AppComponent";
export declare class ViewComponent extends AppComponent {
    static preset(presets: object, View?: UIRenderableConstructor): Function;
    formContext?: ManagedRecord;
    view?: UIRenderable;
    onManagedStateActivatingAsync(): Promise<void>;
    render(callback?: UIRenderContext.RenderCallback): void;
    removeViewAsync(deactivate?: boolean): Promise<{} | undefined>;
    private _renderCallback?;
}
export declare namespace ViewComponent {
    type PresetFor<TComponent, K extends keyof TComponent> = (presets: TComponent | Pick<TComponent, K>) => Function;
}
