// import all packages
import * as _UI from "@typescene/ui";
import * as _Async from "@typescene/async";
import * as _App from "@typescene/app";

// export defaults separately
export { default as UI } from "@typescene/ui";
export { default as Async } from "@typescene/async";
export { default as App } from "@typescene/app";

/** Default "typescene" export with module members */
export default {
    Async: _Async,
    UI: _UI,
    App: _App
};
