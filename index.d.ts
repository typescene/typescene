// import typescene-async and typescene-ui
// NOTE: a specific stable version of typescene-ui MUST be required in package.json

import * as _UI from "typescene-ui";
import * as _Async from "typescene-async";

// export defaults as UI and Async separately
export { default as UI } from "typescene-ui";
export { default as Async } from "typescene-async";

/** Shortcut to @Async.observable decorator */
export declare var observable: typeof _Async.observable;

/** Shortcut to Async.observe function to quickly create an ObservableValue
  * from a getter function or Async.Promise instance, or an ObservableObject
  * from any other object */
export declare var observe: typeof _Async.observe;

/** Default "typescene" export with Async and UI members */
export default {
    Async: typeof _Async,
    UI: typeof _UI
};
