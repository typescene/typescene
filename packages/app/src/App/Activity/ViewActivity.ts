import * as Async from "@typescene/async";
import { Component, Container, DialogContainer, DrawerContainer, Page, Screen }
    from "@typescene/ui";
import { Activity, ResourceActivity } from "./Activity";
import { ActivityResourcePath } from "./ActivityPath";
import { ActivityTransition, ActivitySignal } from "./";

/** The outlet name used for the main view (automatically) */
const MAIN_VIEW_OUTLET_NAME = "";

/** Promise that is set while waiting for Displaying signal; to signify that previous activity should not yet remove its view */
var _displayP: PromiseLike<any> | undefined;

/** Represents an activity that corresponds to a (component or Page on) screen */
export class ViewActivity extends ResourceActivity {
    /** Create a view activity with optional title and view instance, parent reference, and resource path; to add a view component/page dynamically, use the `mapToActivity(...)` decorator on a view Component or Page class, or call the `.mapView(...)` method on this activity */
    constructor(title?: string, path?: ActivityResourcePath | string,
        view?: Component | Page, parent?: Activity | typeof Activity) {
        super(title, path);
        if (view) this._viewGetters[MAIN_VIEW_OUTLET_NAME] = () => view;
        if (parent) this.options.parentActivity = parent;

        // connect to activity life cycle events
        this.Activated.connect(t => this._displayMainView(false, t));
        this.Resumed.connect(t => this._displayMainView(true, t));

        // map views using callbacks set by decorator
        this["@initialize"]();
    }

    /** @internal Injectable method called by the constructor, used for mapping views using decorator on Component and Page classes */
    @Async.injectable
    public ["@initialize"]() { }

    /** The main view component/page that is currently displayed, if any; this is a readonly field, to link a view to an activity use the `mapToActivity(...)` decorator on a view Component or Page class, or call the `.mapView(...)` method on a view activity */
    public get view() { return this._view }

    /** Signal that is emitted before this activity's view is displayed in the foreground (i.e. NOT if displayed as parent view) */
    public readonly Displaying: Async.Signal.Emittable<ViewActivityTransition, typeof ViewActivitySignal> = Async.defineSignal(ViewActivitySignal);

    /** Signal that is emitted after this activity is displayed in the foreground (i.e. NOT if displayed as parent view) */
    public readonly Displayed: Async.Signal.Emittable<ViewActivityTransition, typeof ViewActivitySignal> = Async.defineSignal(ViewActivitySignal);

    /** Register given function to return the view instance for given outlet name, or for the main view if none given; existing getter for the same outlet is replaced, if any; getter must always return a component/page instance, which may be the same instance every time; the function may accept a single parameter, which is the foreground activity (i.e. this activity, or another `ViewActivity` instance that refers to this activity as a parent activity) */
    public mapView(f: (fg: ViewActivity) => (Component | Page),
        outlet = MAIN_VIEW_OUTLET_NAME) {
        this._viewGetters[outlet] = f;
    }

    /** Get an instance of the view component/page for given named outlet on this activity, or main view if none given, by calling the mapped view getter that has been registered through the `.mapView(...)` method (within unobserved function wrapper to avoid observable side effects) */
    public getViewByName(outlet = MAIN_VIEW_OUTLET_NAME): Component | Page | undefined {
        var getter = this._viewGetters[outlet];
        return getter && Async.unobserved(getter, this) || undefined;
    }

    /** Display the view (component on the current page, or a new page) */
    private _displayMainView(resumed: boolean,
        t: ActivityTransition, child?: Activity) {
        var goDisplay = () => {
            this._count++;

            // get current view instance
            var getter = this._viewGetters[MAIN_VIEW_OUTLET_NAME];
            var view = this._view = getter &&
                getter.call(undefined, child || this) || undefined;

            // if not non-modal container or page, go after parent first
            if ((!(view instanceof Container) ||
                !view.displayOptions || !view.displayOptions.modal) &&
                !(view instanceof Page)) {
                // check parent activity/view (class or instance)
                if (this.options.parentActivity) {
                    var parent =
                        (typeof this.options.parentActivity === "function") ?
                            t.activityStack.getParent(
                                <any>this.options.parentActivity, this) :
                            <any>this.options.parentActivity;

                    // display parent first
                    if (parent instanceof ViewActivity)
                        parent._displayMainView(resumed, t, child || this);
                }
            }
            else {
                // otherwise clear the screen before display
                var page = Page.getCurrentPage();
                if (page && page !== view) page.remove();
            }

            // connect to Closed signal to pop activity automatically
            if (view && (<any>view).Closed &&
                typeof (<any>view).Closed.connectOnce === "function") {
                // connect to Closed signal to pop activity automatically
                (<DialogContainer | DrawerContainer>view).Closed
                    .connectOnce(() => {
                        t.activityStack.popAsync(this);
                    });
            }

            // display component or page now
            if (view) {
                Screen.display(view);

                // remove view after activity is suspended (unless overtaken by
                // another call to this function)
                var ref = this._count;
                (child || this).Suspended.connectOnce(t => {
                    // wait for Displayed on new activity to catch up
                    let doRemove = () => {
                        if (_displayP) return _displayP.then(doRemove);
                        if (ref === this._count) {
                            Screen.remove(view);
                            delete this._view;
                        }
                    };
                    Async.defer(doRemove);
                });
            }

            // return view to be stored in view activity transition
            return view;
        }

        // check if called from child, or displaying in foreground
        if (child) {
            // displaying in background only, no need to wait, no signals
            goDisplay();
        }
        else {
            // create ViewActivityTransition object
            for (var tt = t, hops = 0; tt; tt = tt.previous, hops++);
            var viewTransition = Object.seal(<ViewActivityTransition>{
                transition: t,
                view: undefined,
                firstDisplay: !resumed,
                forward: (t.operation !== ActivityTransition.Operation.Pop),
                hops
            });

            // delay slightly to process only if not already skipped over,
            // and emit Displaying first
            var p = _displayP = Async.sleep(2)
                .then((): any => {
                    if (t.activityStack.top === this) {
                        // still in foreground, now emit first signal
                        var signal = new this.Displaying(viewTransition);
                        return Async.Promise.all(signal.emit().results);
                    }
                })
                .then(r => {
                    if (r && t.activityStack.top === this) {
                        // final check passed, go display and emit
                        viewTransition.view = goDisplay();
                        this.Displayed(viewTransition);
                    }
                })
                .catch(err => {
                    // some handler threw an error: drop out
                    if (t.activityStack.top === this) {
                        t.activityStack.popAsync(this);
                        throw new Error("Dropping activity: " + err.message);
                    }
                })
                .then(() => {
                    // remove reference to this promise
                    if (_displayP === p) _displayP = undefined;
                });
        }
    }

    /** View getter(s), registered through mapView method */
    private _viewGetters: { [name: string]: (fg: ViewActivity) => (Component | Page) } = {};

    /** View currently displayed */
    private _view: Component | Page | undefined;

    /** Counter that goes up every time the main view is displayed */
    private _count = 0;
}

/** Represents an activity that corresponds to a component or page on screen, created only once and re-used if required (overrides .getInstance static method); abstract class, needs to be overridden */
export abstract class SingletonViewActivity extends ViewActivity {
    /** Get the instance of this activity class, constructs the instance without parameters once and returns this instance every time */
    public static getInstance() {
        return this._instance || new (<any>this)();
    }

    /** Create a new activity; can be used only once */
    constructor(title?: string, path?: ActivityResourcePath | string,
        view?: Component | Page, parent?: Activity | typeof Activity) {
        super(title, path, view, parent);
        var self = (<typeof SingletonViewActivity>this.constructor);
        if (self._instance)
            throw new Error("Cannot create another instance of this activity");
        self._instance = this;
    }

    private static _instance: SingletonViewActivity;
}

/** Represents a singleton view activity that is both a root activity (i.e. may exist only once on the activity stack, starting/replacing the activity again transitions the stack up to the existing activity instead), and a hub activity (i.e. starting any activity that specifies this activity as its parent activity, transitions the stack up to the hub activity first, suspending all other activities that used to be in the foreground); abstract class, needs to be overridden */
export abstract class RootViewActivity extends SingletonViewActivity {
    constructor(title?: string, path?: ActivityResourcePath | string,
        view?: Component | Page) {
        super(title, path, view);
        this.options.isHubActivity = true;
        this.options.isRootActivity = true;
    }
}

/** Represents a transition from one (view) activity to a view activity that is to be displayed, encapsulates activity transition */
export interface ViewActivityTransition {
    /** The activity transition itself */
    transition: ActivityTransition;

    /** The main view, if any, displayed as a result of this transition */
    view: Component | Page | undefined;

    /** True if displaying this view for the first time (i.e. the activity has just been added, and not resumed or added again) */
    firstDisplay: boolean;

    /** True if adding this view to the browser history (i.e. not resuming from history) */
    forward: boolean;

    /** Number of transitions in the current chain (for checking if e.g. a dropActivity(...) call crossed multiple activities to get to this view) */
    hops: number;
}

/** Signal that is emitted when a change in the activity stack occurs */
export class ViewActivitySignal extends Async.Signal<ViewActivityTransition> { }

/** *Class decorator*, maps the decorated view Component class (with a constructor that has a single matching activity argument) to a ViewActivity class as given named outlet, or as the main view if none specified; view instances are re-used when possible, but are dereferenced within given timeout when no longer in use (in ms, defaults to 2s, set to 0 to disable) [decorator] */
export function mapToActivity<ActivityT extends ViewActivity, ComponentT extends Component>(
    activityClass: { new (...args: any[]): ActivityT },
    outlet?: string,
    dereferenceTimeout = 2000):
    (target: { new (activity: ActivityT): ComponentT }) => void {
    return (target: { new (activity: ViewActivity): any }) => {
        var current = Async.inject(activityClass, {
            "@initialize": function (this: ViewActivity) {
                current["@initialize"].call(this);

                // map this view component/page to given outlet
                var view: Component | Page | undefined;
                var ref = 0;
                this.mapView(fg => {
                    if (dereferenceTimeout > 0) {
                        var lastRef = ++ref;
                        fg.Suspended.connectOnce(() => {
                            // dereference after timeout, unless overtaken
                            // by another call to mapView callback
                            Async.sleep(dereferenceTimeout).then(() => {
                                if (ref === lastRef) view = undefined;
                            });
                        });
                    }
                    return (view || (view = new (<any>target)(this)));
                }, outlet);
            }
        });
    };
}

/** *Class decorator*, maps the decorated view Page class (with a constructor that has a single matching activity argument) to a ViewActivity class as given named outlet, or as the main view if none specified; view instances are re-used when possible, but are dereferenced within given timeout when no longer in use (in ms, defaults to 2s, set to 0 to disable) [decorator] */
export function mapPageToActivity<ActivityT extends ViewActivity, ComponentT extends Component>(
    activityClass: { new (...args: any[]): ActivityT },
    outlet?: string,
    dereferenceTimeout = 2000):
    (target: { new (activity: ActivityT): ComponentT }) => void {
    return <any>mapToActivity(activityClass, outlet, dereferenceTimeout);
}
