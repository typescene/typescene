import Async from "../../Async";
import { Component, Page } from "../../UI";
import { mapViewActivity } from "../View";
import { Activity } from "./Activity";

/** Name for the property on activation objects, set by `ActivationRouter#match` and used by the `getPath` method injected by `mapRoute`, that holds the path that actually lead to the activation */
const MAPROUTE_PATH_PROPERTY = "@mapRoute.path";

/** Functions that return an Activation instance if a given path matches the stored route; hashed by route string to avoid duplication */
const routersByRoute: { [route: string]: ActivationRouter } = {};

/** List of routes currently mapped (with matchers in `routersByRoute`) */
const routesList: string[] = [];

/** Lookup table of known named routes */
const namedRoutes: { [name: string]: ActivationRouter } = {};

/** Encapsulates a command to start an activity; should be extended into unique classes that `Activity` classes can be mapped to using `mapActivation`, and which can be mapped to routes using `mapRoute`; the latter will enable saving parts of a path (URL) to properties on the activation object */
export abstract class Activation {
    /** Returns a new activation object for the given route path (must start with `/` or `#/`), or undefined if none of the currently mapped routes match */
    public static route(path: string) {
        // go through the list of mapped routes and run matchers one by one
        if (typeof path === "string" && /^#?\//.test(path)) {
            for (var r of routesList) {
                var result = routersByRoute[r].match(path);
                if (result) return result;
            }
        }
        return undefined;
    }

    /** Create a new activation object, which can be used (with a derived class) to start an activity based on the Activation class type, and stored property values; copies all properties from the given object, if any */
    constructor(properties?: object) {
        if (properties) {
            // copy all given properties to this instance
            for (var p in properties)
                if (Object.prototype.hasOwnProperty.call(properties, p))
                    this[p] = (<any>properties)[p];
        }
    }

    /** Returns a promise for an activity instance, or for undefined if no `Activity` class is mapped to this activation type; this method is injected by `mapActivation`, but can also be overridden directly to customize the behavior of creating activities for activation objects (e.g. testing for valid IDs, or lazy loading) */
    @Async.injectable
    public getActivityAsync(): PromiseLike<Activity | undefined> {
        // (injected by mapActivation)
        return Async.Promise.resolve(undefined);
    }

    /** Returns the full path that will route to this activation object (or the path that this object was actually created for, using `mapRoute`), or undefined if no route has been mapped to this activation class or if one of the route parameters is missing */
    @Async.injectable
    public getPath(): string | undefined {
        // (injected by mapRoute)
        return undefined;
    }

    /** Activation object property */
    [p: string]: any;
}

/** Activation router (internal), created for a mapped route */
class ActivationRouter {
    constructor(route: string, target: typeof Activation) {
        this.target = <any>target;

        // dissect given route for faster matching later
        this._routeSegments = route.split("/").filter(s => !!s);
        this._isHashRoute = this._routeSegments[0] === "#";
        if (this._isHashRoute) this._routeSegments.shift();
        if (this._routeSegments.length &&
            this._routeSegments[0][0] === "&") {
            // this is a sub route, remove & store first segment
            this._isSubRoute = true;
            this._parentRouteName = this._routeSegments.shift()!.slice(1);
        }
    }

    /** The activation class to be instantiated when matched */
    public target: { new (properties?: object): Activation };

    /** Returns the full path that will route to given activation object (or the path that the object was actually created for, using `mapRoute`), or undefined if no route has been mapped to the activation class or if one of the route parameters is missing */
    public getPathFor(activation: Activation) {
        if (activation[MAPROUTE_PATH_PROPERTY]) {
            // use actual path used
            return activation[MAPROUTE_PATH_PROPERTY];
        }

        var result = "";
        if (this._isSubRoute) {
            // get path from parent activation router first
            var parent = namedRoutes[this._parentRouteName!];
            if (!parent) return undefined;
            result = parent.getPathFor(activation);
            if (result === undefined) return undefined;
        }
        else if (this._isHashRoute) {
            result = "#";
        }

        // add all path segments for this route
        for (var segment of this._routeSegments) {
            if (segment[0] === "*" || segment[0] === ":") {
                // substitute activation property
                var value = activation[segment.slice(1)];
                if (value === undefined || value === null) return undefined;
                result += "/" + value;
            }
            else {
                // include segment literally
                result += "/" + segment;
            }
        }
        return result;
    }

    /** Returns a new activation object if the given path matches the mapped route */
    public match(path: string): Activation | undefined {
        var idx = (path[0] === "#") ? 1 : 0;
        var segments = this._routeSegments;
        if (!segments.length && this._isHashRoute && /^[^#]*#?$/) {
            // always match home path #/ for a hashless path
            return new this.target();
        }
        if (this._isSubRoute) {
            // look for parent route first, prepend segments
            var parent = namedRoutes[this._parentRouteName!];
            if (!parent) return undefined;
            if (!!idx !== parent._isHashRoute) return undefined;
            segments = parent._routeSegments.slice(0);
            segments.push.apply(segments, this._routeSegments);
        }
        else {
            // give up early if not hash route and path
            if (!!idx !== this._isHashRoute) return undefined;
        }

        // match route segments one by one
        var segmentIdx = 0, parameters: { [name: string]: string } = {};
        while (segmentIdx < segments.length) {
            if (path[idx++] !== "/") return undefined;
            if (path.length <= idx) return undefined;
            var spec = segments[segmentIdx++];
            if (spec[0] === "*") {
                // match glob: store remainder in a parameter
                parameters[spec.slice(1)] = path.slice(idx);
                idx = path.length;
                continue;
            }

            // find next segment in given path
            var end = path.indexOf("/", idx);
            if (end < 0) end = path.length;
            if (spec[0] === ":") {
                // match parameter: store next segment in a parameter
                parameters[spec.slice(1)] = path.slice(idx, end);
            }
            else if (spec !== path.slice(idx, end)) {
                // segment does not match
                return undefined;
            }
            idx = end;
        }

        // all segments matched, if path is fully consumed then create the activation
        if (idx >= path.length || path.slice(idx) === "/") {
            parameters[MAPROUTE_PATH_PROPERTY] = path;
            return new this.target(parameters);
        }

        // no match: path is longer than route
        return undefined;
    }

    private readonly _routeSegments: string[];
    private readonly _isHashRoute: boolean;
    private readonly _isSubRoute: boolean;
    private readonly _parentRouteName?: string;
}

/** *Class decorator*, maps the decorated `Activation` (sub) class OR `Activity` class OR `Component` (ui module) class to the given route (e.g `dashboard`, `/users/:userID/post/:postID` or `#/docs/*docName`); if a name is provided, it can be used at the start of sub routes, using `&name/sub/route` (without leading hash/slash chars); multiple routes can be added per class; if the decorated class is an `Activity` class, a unique `Activation` sub class is generated automatically, and if the decorated class is a UI `Component` or `Page` class, a unique `Activity` class is also generated [decorator] */
export function mapRoute(route: string, name?: string) {
    return (target: typeof Activation | typeof Activity | { new(activity: Activity): (Component | Page) }) => {
        // if target is a view class, generate unique Activity class
        if ((target as Function).prototype instanceof Component ||
            (target as Function).prototype instanceof Page) {
            var ViewActivity = class MappedViewActivity extends Activity { };
            mapViewActivity(ViewActivity)(<any>target);
            target = ViewActivity;
        }

        // if target is an activity class, generate unique Activation class
        if ((target as Function).prototype instanceof Activity) {
            var activation = class MappedActivation extends Activation { };
            mapActivation(activation)(<any>target);
            target = activation;
        }

        // store activation route for use while matching paths to routes
        if (routesList.indexOf(route) < 0) routesList.unshift(route);
        var router = new ActivationRouter(route, <any>target);
        routersByRoute[route] = router;
        if (name) namedRoutes[name] = router;

        // inject method for generating a full path for an activation object
        Async.inject(target as Function, {
            getPath(this: Activation) { return router.getPathFor(this) }
        });
    };
}

/** *Class decorator*, maps the decorated `Activity` class to given `Activation` type, so that routed (path/URL) and manual activations (using an activation object) lead to the instantiation of the decorated `Activity` [decorator] */
export function mapActivation(activationType: typeof Activation) {
    return (target: typeof Activity & { getInstance(activation: Activation): Activity }) => {
        // inject method to obtain an activity for instances of this activation type
        Async.inject(activationType, {
            getActivityAsync(this: Activation): PromiseLike<Activity> {
                return Async.Promise.resolve(target.getInstance(this));
            }
        });
    };
}
