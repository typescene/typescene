const t = require("promises-aplus-tests");
const Async = require("../");
Async.UnhandledException.disconnectAll();
t({
    deferred: () => {
        var p = new Async.Promise();
        return {
            promise: p,
            resolve: (v) => p._resolve(v),
            reject: (e) => p._reject(e)
        };
    }
});