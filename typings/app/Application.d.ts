import { Component, ComponentConstructor, ComponentList, ManagedList } from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
import { AppActivity } from "./AppActivity";
export declare class Application extends Component {
    static active: ManagedList<Application>;
    static preset(presets: Application.Presets, ...activities: Array<ComponentConstructor & (new () => AppActivity)>): Function;
    constructor();
    readonly name: string;
    activities?: ComponentList<AppActivity>;
    renderContext?: UIRenderContext;
    activationContext?: AppActivationContext;
    activateAsync(): Promise<void>;
    deactivateAsync(): Promise<void>;
    destroyAsync(): Promise<void>;
    navigate(path: string): this;
    add(...activities: AppActivity[]): this;
    showViewActivityAsync<TViewActivity extends AppActivity & {
        render: Function;
    }>(viewActivity: TViewActivity): Promise<TViewActivity>;
}
export declare namespace Application {
    interface Presets {
        name?: string;
        renderContext?: UIRenderContext;
        activationContext?: AppActivationContext;
    }
}
