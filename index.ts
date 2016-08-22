// == import typescene-async library
import * as _Async from "typescene-async";

/** Library for asynchronous programming */
export var Async = _Async;

/** Shortcut to @Async.observable decorator */
export var observable: typeof _Async.observable = _Async.observable;

/** Shortcut to Async.observe function to quickly create an ObservableValue
  * from a getter function or Async.Promise instance, or an ObservableObject
  * from any other object */
export var observe: typeof _Async.observe = _Async.observe;

// == import typescene-ui library
import * as _UI from "typescene-ui";

/** Library for strongly typed web UIs */
export var UI = _UI;

// export modules through default export as well
export default { Async: _Async, UI: _UI };