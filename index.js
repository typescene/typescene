"use strict";

// export typescene-async library
var Async = require("typescene-async");
exports.Async = Async;
exports.observable = Async.observable;
exports.observe = Async.observe;

// export typescene-ui library
var UI = require("typescene-ui");
exports.UI = UI;

// TypeScript-compatible default export
var _default = {
  Async: Async,
  UI: UI,
  observe: Async.observe
};
exports.__esModule = true;
exports["default"] = _default;

// expose UI and Async separately on window, too
if (typeof window === "object") {
  window["Async"] = Async;
  window["UI"] = UI;
  window["typescene"] = _default;
}