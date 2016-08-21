// re-export Async module in its entirety
import * as _Async from "typescene-async";
import { observable as _observable,
    observe as _observe } from "typescene-async";
export var Async = _Async;

/** Shortcut to @Async.observable decorator */
export var observable = _observable;

/** Shortcut to Async.observe function */
export var observe = _observe;

// export UI module both as default and as UI
import * as _UI from "./UI";
export var UI = _UI;
export default UI;
