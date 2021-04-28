import {
  ManagedService,
  Component,
  service,
  ManagedEvent,
  delegateEvents,
  ManagedChangeEvent,
} from "../../../dist";

consider("ManagedService", () => {
  it("can be registered", t => {
    class TestService extends ManagedService {
      name = "Test1";
    }
    let s = new TestService();
    s.register();
    t.test(s === ManagedService.find("Test1"));
  });

  it("can be used as a property", t => {
    class TestService extends ManagedService {
      name = "Test2";
    }
    let s = new TestService();
    s.register();
    class TestComponent extends Component {
      @service("Test2")
      s?: TestService;
    }
    let c = new TestComponent();
    t.test(s === c.s);
  });

  it("can be observed", t => {
    class TestService extends ManagedService {
      name = "Test3";
    }
    let s = new TestService();
    s.register();
    class TestComponent extends Component {
      @service("Test3")
      s?: TestService;
    }
    let ok = false;
    TestComponent.addObserver(
      class {
        onSChange(_value: any, event: ManagedEvent) {
          if (event) ok = true;
        }
      }
    );
    let c = new TestComponent();
    c.s; // access at least once
    s.emitChange();
    t.test(ok, "Change event should trigger observer method");
  });

  it("can be observed using event delegation", t => {
    class TestService extends ManagedService {
      name = "Test4";
    }
    let s = new TestService();
    s.register();
    class TestComponent extends Component {
      @delegateEvents
      @service("Test4")
      s?: TestService;
      protected delegateEvent(e: ManagedEvent, name: string) {
        if (e instanceof ManagedChangeEvent && name === "s") t.ok();
      }
    }
    let c = new TestComponent();
    c.s; // access at least once
    s.emitChange();
  });

  it("can be observed before registration", t => {
    class TestComponent extends Component {
      @service("Test5")
      @delegateEvents
      s?: TestService;
      protected delegateEvent(e: ManagedEvent, name: string) {
        if (e instanceof ManagedChangeEvent && name === "s") t.ok();
      }
    }
    let c = new TestComponent();
    class TestService extends ManagedService {
      name = "Test5";
    }
    let s = new TestService();
    s.register();
    c.s; // access at least once
    s.emitChange();
  });
});
