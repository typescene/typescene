import {
  managed,
  ManagedEvent,
  ManagedObject,
  observe,
  onPropertyEvent,
  rateLimit,
} from "../../../dist";

consider("Observers", () => {
  it("can observe events", t => {
    class A extends ManagedObject {
      @observe
      static AObserver = class {
        onEvent(e: ManagedEvent) {
          if (e.name === "OK") t.count(2);
        }
      };
    }
    A.addObserver(
      class {
        onEvent(e: ManagedEvent) {
          if (e.name === "OK") t.count(2);
        }
      }
    );
    new A().emit("OK");
  });

  it("can observe events (async)", async t => {
    t.failOnTimeout();
    class A extends ManagedObject {
      @observe
      static AObserver = class {
        onEventAsync(e: ManagedEvent) {
          if (e.name === "OK") t.count(2);
        }
      };
    }
    A.addObserver(
      class {
        onEventAsync(e: ManagedEvent) {
          if (e.name === "OK") t.count(2);
        }
      }
    );
    new A().emit("OK");
    t.assert(!t.getCount(), "Handler called synchronously");
  });

  it("can observe events (rate limited)", async t => {
    t.failOnTimeout();
    let order = "";
    class A extends ManagedObject {}
    class AObserver {
      @rateLimit(100)
      onEventAsync(e: ManagedEvent) {
        order += e.name;
      }
    }
    A.addObserver(AObserver);
    let a = new A();
    a.emit("1"), a.emit("2"); // trigger 2 immed async
    order += "A";
    setTimeout(() => a.emit("3"), 30); // skip
    setTimeout(() => a.emit("4"), 40); // held until ~100ms
    setTimeout(() => (order += "B"), 50);
    setTimeout(() => a.emit("5"), 130); // skip
    setTimeout(() => a.emit("6"), 140); // held until ~200ms
    setTimeout(() => (order += "C"), 150);
    t.waitAsync(300, () => {
      t.test(order === "A2B4C6");
    });
  });

  it("can observe property changes", t => {
    class A extends ManagedObject {
      a?: string;

      @observe
      static AObserver = class {
        onAChange(v: string) {
          if (v === "OK") t.count(2);
        }
      };
    }
    A.addObserver(
      class {
        onAChange(v: string) {
          if (v === "OK") t.count(2);
        }
      }
    );
    new A().a = "OK";
  });

  it("can observe property changes (async)", async t => {
    t.failOnTimeout();
    class A extends ManagedObject {
      a?: string;

      @observe
      static AObserver = class {
        onAChangeAsync(v: string) {
          if (v === "OK") t.count(2);
        }
      };
    }
    A.addObserver(
      class {
        onAChangeAsync(v: string) {
          if (v === "OK") t.count(2);
        }
      }
    );
    new A().a = "OK";
    t.assert(!t.getCount(), "Handler called synchronously");
  });

  it("can observe property changes (rate limited)", async t => {
    let order = "";
    t.failOnTimeout();
    class A extends ManagedObject {
      a?: string;
    }
    class AObserver {
      @rateLimit(100)
      onAChangeAsync(v: string) {
        order += v;
      }
    }
    A.addObserver(AObserver);
    let a = new A();
    (a.a = "1"), (a.a = "2"); // trigger 2 immed async
    order += "A";
    setTimeout(() => (a.a = "3"), 30); // skip
    setTimeout(() => (a.a = "4"), 40); // held until ~100ms
    setTimeout(() => (order += "B"), 50);
    setTimeout(() => (a.a = "5"), 130); // skip
    setTimeout(() => (a.a = "6"), 140); // held until ~200ms
    setTimeout(() => (order += "C"), 150);
    t.waitAsync(300, () => {
      t.test(order === "A2B4C6");
    });
  });

  it("can observe property events", t => {
    class B extends ManagedObject {}
    class A extends ManagedObject {
      @managed
      b = new B();
    }
    class AObserver {
      @onPropertyEvent("b")
      handleBEvent(_v: B, e: ManagedEvent) {
        if (e.name === "OK") t.ok();
      }
    }
    A.addObserver(AObserver);
    new A().b.emit("OK");
  });

  it("can observe property events (async)", async t => {
    t.failOnTimeout();
    class B extends ManagedObject {}
    class A extends ManagedObject {
      @managed
      b = new B();
    }
    class AObserver {
      @onPropertyEvent("b")
      handleBEventAsync(_v: B, e: ManagedEvent) {
        if (e.name === "OK") t.ok();
      }
    }
    A.addObserver(AObserver);
    new A().b.emit("OK");
    t.assert(!t.getCount(), "Handler called synchronously");
  });

  it("can observe property events (rate limited)", async t => {
    let order = "";
    t.failOnTimeout();
    class B extends ManagedObject {}
    class A extends ManagedObject {
      @managed
      b = new B();
    }
    class AObserver {
      @onPropertyEvent("b")
      @rateLimit(100)
      handleBEventAsync(_v: B, e: ManagedEvent) {
        order += e.name;
      }
    }
    A.addObserver(AObserver);
    let a = new A();
    a.b.emit("1"), a.b.emit("2"); // trigger 2 immed async
    order += "A";
    setTimeout(() => a.b.emit("3"), 30); // skip
    setTimeout(() => a.b.emit("4"), 40); // held until ~100ms
    setTimeout(() => (order += "B"), 50);
    setTimeout(() => a.b.emit("5"), 130); // skip
    setTimeout(() => a.b.emit("6"), 140); // held until ~200ms
    setTimeout(() => (order += "C"), 150);
    t.waitAsync(300, () => {
      t.test(order === "A2B4C6");
    });
  });
});
