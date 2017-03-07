"use strict";

// export async library
var Async = require("@typescene/async");
exports.Async = Async;

// export ui library
var UI = require("@typescene/ui");
exports.UI = UI;

// export app library
var App = require("@typescene/app");
exports.App = App;

// TypeScript-compatible default export
var _default = {
  Async: Async,
  UI: UI,
  App: App
};
exports.__esModule = true;
exports["default"] = _default;

// expose libraries on `window`, too
if (typeof window === "object") {
  window["Async"] = Async;
  window["UI"] = UI;
  window["App"] = App;
  window["typescene"] = _default;
}
