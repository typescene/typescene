import { Component, ComponentConstructor, ComponentList, managedChild, ManagedList } from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
import { AppActivity } from "./AppActivity";

/** Represents an independent part of the user interface */
export class Application extends Component {
    /** All `Application` instances that are currently active */
    static active = (() => {
        let result = new ManagedList<Application>();
        Application.observe(class {
            constructor(public instance: Application) { }
            onActive() { if (!result.includes(this.instance)) result.add(this.instance) }
            onInactive() { result.remove(this.instance) }
        });
        return result;
    })();

    static preset(presets: Application.Presets,
        ...activities: Array<ComponentConstructor & (new () => AppActivity)>): Function {
        if (activities.length) {
            this.presetActiveComponent("activities",
                ComponentList.with(...activities),
                AppActivity);
        }
        return super.preset(presets);
    }

    /** Create a new `Application` instance. Do not use the base constructor, but use a class created using `Component.with` instead (exposed as `Application.with`). */
    constructor() {
        super();
        if (!this.isPresetComponent()) {
            throw Error("[Application] Cannot construct application using this constructor");
        }
    }

    /** The application name */
    readonly name = "Application";

    /** List of root activities, as child components */
    @managedChild
    activities?: ComponentList<AppActivity>;

    /** Application render context as a managed child object, propagated to all (nested) `AppComponent` instances */
    @managedChild
    renderContext?: UIRenderContext;

    /** Activity activation context as a managed child object, propagated to all (nested) `AppComponent` instances */
    @managedChild
    activationContext?: AppActivationContext;

    /** Activate this application, immediately creating all primary activities */
    async activateAsync() { await this.activateManagedAsync() }

    /** Deactivate this application, immediately destroying all actvities */
    async deactivateAsync() { await this.deactivateManagedAsync() }

    /** Destroy this application, immediately destroying all activities */
    async destroyAsync() { await this.destroyManagedAsync() }

    /** Navigate to given (relative) path, or go back in history if argument is `:back`, using the current `Application.activationContext` */
    navigate(path: string) {
        if (this.activationContext) this.activationContext.navigate(path);
        return this;
    }

    /** Add given activities to the application. Activities with matching paths will be activated immediately (see `AppActivity.path`). */
    add(...activities: AppActivity[]) {
        if (!this.activities) {
            throw Error("[Application] Cannot add activities to inactive application");
        }
        this.activities.add(...activities.filter(a => !this.activities!.includes(a)));
        return this;
    }

    /**
     * Add given view activity to the application, and activate it immediately regardless of `AppActivity.path`; this causes corresponding views to be rendered if possible.
     * @returns A promise that resolves to the view activity after it has been activated.
     */
    async showViewActivityAsync<TViewActivity extends AppActivity & { render: Function }>(
        viewActivity: TViewActivity) {
        this.add(viewActivity);
        await viewActivity.activateAsync();
        return viewActivity;
    }
}

export namespace Application {
    /** Application presets type, for use with `Component.with` */
    export interface Presets {
        /** Human readable application name */
        name?: string,
        /** Platform dependent application render context */
        renderContext?: UIRenderContext,
        /** Platform dependent activation context (router) */
        activationContext?: AppActivationContext
    }
}
