import * as _Async from "typescene-async";
/** Library for asynchronous programming */
export declare var Async: typeof _Async;
/** Shortcut to @Async.observable decorator */
export declare var observable: typeof _Async.observable;
/** Shortcut to Async.observe function to quickly create an ObservableValue
  * from a getter function or Async.Promise instance, or an ObservableObject
  * from any other object */
export declare var observe: typeof _Async.observe;
import * as _UI from "typescene-ui";
/** Library for strongly typed web UIs */
export declare var UI: typeof _UI;
declare var _default: {
    Async: typeof _Async;
    UI: typeof _UI;
};
export default _default;
