import { Component, ComponentConstructor, ComponentList, ManagedList } from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
import { AppActivity } from "./AppActivity";
/** Represents an independent part of the user interface */
export declare class Application extends Component {
    /** All `Application` instances that are currently active */
    static active: ManagedList<Application>;
    static preset(presets: Application.Presets, ...activities: Array<ComponentConstructor & (new () => AppActivity)>): Function;
    /** Create a new `Application` instance. Do not use the base constructor, but use a class created using `Component.with` instead (exposed as `Application.with`). */
    constructor();
    /** The application name */
    readonly name: string;
    /** List of root activities, as child components */
    activities?: ComponentList<AppActivity>;
    /** Application render context as a managed child object, propagated to all (nested) `AppComponent` instances */
    renderContext?: UIRenderContext;
    /** Activity activation context as a managed child object, propagated to all (nested) `AppComponent` instances */
    activationContext?: AppActivationContext;
    /** Activate this application, immediately creating all primary activities */
    activateAsync(): Promise<void>;
    /** Deactivate this application, immediately destroying all actvities */
    deactivateAsync(): Promise<void>;
    /** Destroy this application, immediately destroying all activities */
    destroyAsync(): Promise<void>;
    /** Navigate to given (relative) path, or go back in history if argument is `:back`, using the current `Application.activationContext` */
    navigate(path: string): this;
    /** Add given activities to the application. Activities with matching paths will be activated immediately (see `AppActivity.path`). */
    add(...activities: AppActivity[]): this;
    /**
     * Add given view activity to the application, and activate it immediately regardless of `AppActivity.path`; this causes corresponding views to be rendered if possible.
     * @returns A promise that resolves to the view activity after it has been activated.
     */
    showViewActivityAsync<TViewActivity extends AppActivity & {
        render: Function;
    }>(viewActivity: TViewActivity): Promise<TViewActivity>;
}
export declare namespace Application {
    /** Application presets type, for use with `Component.with` */
    interface Presets {
        /** Human readable application name */
        name?: string;
        /** Platform dependent application render context */
        renderContext?: UIRenderContext;
        /** Platform dependent activation context (router) */
        activationContext?: AppActivationContext;
    }
}
