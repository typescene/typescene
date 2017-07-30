import * as Async from "./Async";
import * as UI from "./UI";
import * as App from "./App";
export { Async, UI, App };
export default { Async, UI, App };
import * as core from "@typescene/core";
    
// export all modules as global variables
var w: any = window;
w["typescene"] = { Async, UI, App, core };
w["Async"] = Async;
w["UI"] = UI;
w["App"] = App;
