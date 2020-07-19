import { UnhandledErrorEmitter, UnhandledErrorEvent } from "../../../dist";

consider("UnhandledErrorEmitter", () => {
  it("can be observed to catch errors", t => {
    UnhandledErrorEmitter.addEventHandler(e => {
      if (e instanceof UnhandledErrorEvent) {
        if (e.error.name === "TEST") t.ok();
      }
    });
    let err = Error("Hello");
    err.name = "TEST";
    UnhandledErrorEmitter.instance.emit(UnhandledErrorEvent, err);
  });
});
