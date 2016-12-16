"use strict";

// export typescene-async library
var Async = require("typescene-async");
exports.Async = Async;
exports.observable = Async.observable;
exports.observe = Async.observe;

// export typescene-ui library
var UI = require("typescene-ui");
exports.UI = UI;

// export typescene-app library
var App = require("typescene-app");
exports.App = App;

// TypeScript-compatible default export
var _default = {
  Async: Async,
  UI: UI,
  App: App,
  observable: Async.observable,
  observe: Async.observe
};
exports.__esModule = true;
exports["default"] = _default;

// expose UI and Async separately on window, too
if (typeof window === "object") {
  window["Async"] = Async;
  window["UI"] = UI;
  window["App"] = App;
  window["typescene"] = _default;
}