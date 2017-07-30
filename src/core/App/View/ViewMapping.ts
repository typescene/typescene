import Async from "../../Async";
import { Component, Page, Screen } from "../../UI";
import { Activity, ActivityStack } from "../Activity";
import { isLayoutFragment } from "./ViewLayout";
import { Application } from "../Application";

const VIEW_INITIALIZED_PROP = "@_view_";
const VIEW_MAP_PREFIX = "#view:";

/** Next UID to be used by mapViewActivity */
var _nextUID = 0;

/** Represents a mapping between an activity and a view class */
class ViewMapping {
    /** Map the given activity to given view class, with given dereference timeout (or 0 to disable dereferencing); also connects to the activity's Resumed signal, once per activity instance */
    static mapView(activity: Activity,
        View: { new (activity: Activity): (Component | Page) },
        timeout: number) {
        // create and store the view mapping in the activity object
        var mapping = (<any>activity)[VIEW_MAP_PREFIX + _nextUID++] = new ViewMapping;
        mapping._activity = activity;
        mapping._View = View;
        mapping._timeout = timeout;

        // connect to the Resumed signal to display (parent) view(s)
        // and add layout(s) -- but only once for each activity instance
        if (!(<any>activity)[VIEW_INITIALIZED_PROP]) {
            (<any>activity)[VIEW_INITIALIZED_PROP] = true;
            activity.Resumed.connect(t => {
                // wait just a bit to see if stack will skip over
                Async.sleep(2).then(() => {
                    var cursor = t.activityStack.getCursor();
                    if (cursor.activity === activity) {
                        try { this._display(cursor) }
                        catch (err) {
                            t.activityStack.popAsync(activity);
                            throw err;
                        }
                    }
                });
            });
        }
    }

    /** Display views for the activity at the top of the stack; throws an error if there is nothing to display */
    private static _display(cursor: ActivityStack.Cursor) {
        var activity = cursor.activity!;
        var views = this._findViews(activity, cursor);

        if (!views.length) {
            // back up if nothing to display
            throw new Error("No view mapped for this activity");
        }
        else if (views.some(v => (v instanceof Page))) {
            // displaying a (new) page, let Screen figure it out
            views.forEach(v => Screen.displayAsync(v));
        }
        else {
            // try to use existing page if it features the same content
            var current = Page.getCurrentPage();
            if (current && current.content[0] === views[0]) {
                // just replace content array
                current.content = <Component[]>views;
            }
            else {
                // create a new page and display everything in one go
                new Page(<Component[]>views).displayAsync();
            }
        }
    }

    /** Find (parent) views up to the first full (non-modal) view instance, and add layout fragments on the way back up; returns an array of views to be displayed */
    private static _findViews(fg: Activity, cursor: ActivityStack.Cursor,
        seen: any = {}, traceParents?: boolean) {
        var activity = cursor.activity;
        while (activity &&
            (!(<any>activity)[VIEW_INITIALIZED_PROP] || seen[activity.uid])) {
            if (traceParents) activity = cursor.goParent().activity;
            else activity = cursor.goBack().activity;
        }
        if (activity) {
            // make sure this activity is not checked again
            seen[activity.uid] = true;

            // found a mapped activity, get instances for all views
            var result: Array<Component | Page> = [];
            var fragments: Component[] = [];
            var hasFullView: boolean | undefined;
            for (var id in activity) {
                if (id[0] === "#" && id.slice(0, 6) === VIEW_MAP_PREFIX) {
                    var view = (<ViewMapping>(<any>activity)[id])._getInstance(fg);
                    if (view instanceof Page) {
                        // found a page, use it as a full view (sort to front)
                        hasFullView = true;
                        result.unshift(view);
                        if (result[1] && (result[1] instanceof Page)) {
                            // keep only one page instance
                            result.splice(1, 1);
                        }
                    }
                    else if (isLayoutFragment(view)) {
                        // found a fragment only, try to use it later
                        fragments.push(view);
                    }
                    else if (view.displayOptions && view.displayOptions.modal) {
                        // found a modal view, use it on top of other views
                        result.push(view);

                        // connect to Closed signal to pop activity automatically
                        let Closed = (<any>view).Closed;
                        if (Closed && typeof Closed.connectOnce === "function") {
                            Closed.connectOnce(() => {
                                cursor.activityStack.popAsync(activity!);
                            });
                        }
                    }
                    else {
                        // found a full view component
                        hasFullView = true;
                        result.push(view);
                    }
                }
            }

            // keep looking if no full view component was found
            if (!hasFullView && fragments.length) {
                // got a fragment: check with parents first
                var parentViews = this._findViews(fg,
                    cursor.clone().goParent(), seen, true);
                for (let i = parentViews.length - 1; i >= 0; i--) {
                    var parentView = parentViews[i];
                    if ((parentView instanceof Page) ||
                        !parentView.displayOptions ||
                        !parentView.displayOptions.modal)
                        hasFullView = true;
                    result.unshift(parentView);
                }
            }
            if (!hasFullView) {
                // check with previous activities
                result = this._findViews(fg, cursor.goBack(), seen)
                    .concat(result);
            }

            // add fragments to full views where possible
            fragments.forEach(frag => {
                for (let i = result.length - 1; i >= 0; i--) {
                    let view = result[i];
                    if ((view instanceof Component) &&
                        isLayoutFragment(frag, view)) {
                        view.appendChild(frag);
                        break;
                    }
                }
            });
            return result;
        }
        return [];
    }

    /** Private constructor, do not use directly: use static method `.mapView` instead */
    private constructor() { }

    /** Create a view instance (or use the existing instance), and watch given foreground activity for suspension to dereference the view instance */
    private _getInstance(fg: Activity) {
        var instance: Component | Page;
        if (this._timeout > 0) {
            var ref = ++this._ref;
            fg.Suspended.connectOnce(() => {
                // check if reactivated application activity
                if (this._instanceIndex !== Application.current.activationIndex) {
                    // dereference immediately
                    delete this._instance;
                    return;
                }

                // dereference after timeout, unless overtaken
                // by another call to getInstance
                Async.sleep(this._timeout).then(() => {
                    if (ref === this._ref && instance === this._instance)
                        delete this._instance;
                });
            });
        }
        if (this._instanceIndex !== Application.current.activationIndex) {
            delete this._instance;
            this._instanceIndex = Application.current.activationIndex;
        }
        return instance = this._instance || (this._instance =
            new this._View(this._activity));
    }
    private _instance?: Component | Page;
    private _instanceIndex?: number;

    private _activity: Activity;
    private _View: { new (activity: Activity): (Component | Page) };
    private _timeout: number;
    private _ref = 0;
}

/** *Class decorator*, maps the decorated view class to an `Activity` class; the view class should be a UI `Component` or `Page` class with a constructor that has a single matching activity argument, possibly a view layout or fragment class that derives from the types in the `Layout` namespace; if the view class is a fragment, it is automatically added to the (parent) activity's matching view; re-uses view instances when possible, but views are dereferenced within given timeout when no longer in use (in ms, defaults to 2s, set to 0 to disable) [decorator] */
export function mapViewActivity<ActivityT extends Activity>(
    activityClass: { new(...args: any[]): ActivityT }, dereferenceTimeout = 2000) {
    return (target: { new (activity: ActivityT): (Component | Page) }) => {
        // inject initializer into the activity class
        var current = Async.inject(activityClass, {
            "@initialize": function (this: Activity) {
                ViewMapping.mapView(this, target, dereferenceTimeout);
                current["@initialize"].call(this);
            }
        });
    };
}
