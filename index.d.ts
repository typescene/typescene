// import all packages
import * as _UI from "typescene-ui";
import * as _Async from "typescene-async";
import * as _App from "typescene-app";

// export defaults separately
export { default as UI } from "typescene-ui";
export { default as Async } from "typescene-async";
export { default as App } from "typescene-app";

/** Shortcut to @Async.observable decorator */
export declare var observable: typeof _Async.observable;

/** Shortcut to Async.observe function to quickly create an ObservableValue
  * from a getter function or Async.Promise instance, or an ObservableObject
  * from any other object */
export declare var observe: typeof _Async.observe;

/** Default "typescene" export with module members */
export default {
    Async: typeof _Async,
    UI: typeof _UI,
    App: typeof _App
};
