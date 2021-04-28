import {
  Component,
  managedChild,
  bind,
  ComponentConstructor,
  ManagedList,
  managed,
  delegateEvents,
} from "../../../dist";

consider("Component", () => {
  it("can be created", t => {
    class MyComponent extends Component {
      a = 123;
    }
    t.test(new MyComponent());
  });

  it("supports bound components", t => {
    class ChildComponent extends Component {
      a = 123;
    }
    class MyComponent extends Component {
      @managedChild child = new ChildComponent();
    }
    MyComponent.presetBoundComponent("child", ChildComponent);
    let c = new MyComponent();
    t.test(c.child.getBoundParentComponent() === c);
  });

  it("supports nested bound components (nest after assignment)", t => {
    class ChildComponent extends Component {
      a = 123;
      @managedChild child?: ChildComponent;
    }
    class MyComponent extends Component {
      @managedChild child = new ChildComponent();
    }
    MyComponent.presetBoundComponent("child", ChildComponent);
    let c = new MyComponent();
    c.child.child = new ChildComponent();
    t.test(c.child.child.getBoundParentComponent() === c);
  });

  it("supports nested bound components (nest before assignment)", t => {
    class ChildComponent extends Component {
      constructor(nest?: boolean) {
        super();
        if (nest) this.child = new ChildComponent();
      }
      a = 123;
      @managedChild child?: ChildComponent;
    }
    class MyComponent extends Component {
      @managedChild child = new ChildComponent(true);
    }
    MyComponent.presetBoundComponent("child", ChildComponent);
    let c = new MyComponent();
    t.test(c.child.child?.getBoundParentComponent() === c);
  });

  it("supports nested bound components within lists", t => {
    class ChildComponent extends Component {
      a = 123;
      @managedChild children = new ManagedList().restrict(ChildComponent);
    }
    class MyComponent extends Component {
      @managedChild child = new ChildComponent();
    }
    MyComponent.presetBoundComponent("child", ChildComponent);
    let c = new MyComponent();
    c.child.children.add(new ChildComponent());
    t.test(c.child.children.first()!.getBoundParentComponent() === c);
  });

  it("supports bindings on nested bound components (nest after assignment)", t => {
    class ChildComponent extends Component {
      a = 123;
      @managedChild
      child?: ChildComponent;
    }
    const ComponentWithBinding = ChildComponent.with({ a: bind("b") });
    class MyComponent extends Component {
      b = 0;
      @managedChild child = new ComponentWithBinding();
    }
    MyComponent.presetBoundComponent("child", ComponentWithBinding);
    let c = new MyComponent();
    c.child.child = new ComponentWithBinding();
    c.b = 456;
    t.waitAsync(10, () => {
      t.test(c.child.a === 456 && c.child.child!.a === 456);
    });
  });

  it("supports bindings on nested bound components (nest before assignment)", t => {
    class ChildComponent extends Component {
      a = 123;
      @managedChild child?: ChildComponent;
    }
    const ComponentWithBinding = ChildComponent.with({ a: bind("b") });
    class MyComponent extends Component {
      b = 0;
      @managedChild child?: ChildComponent;
    }
    MyComponent.presetBoundComponent("child", ComponentWithBinding);
    let c = new MyComponent();
    let child = new ComponentWithBinding();
    child.child = new ComponentWithBinding();
    c.child = child;
    c.b = 456;
    t.waitAsync(10, () => {
      t.test(c.child!.a === 456 && c.child!.child!.a === 456);
    });
  });

  it("supports bindings from parents parents components", t => {
    class ChildComponent extends Component {
      a = 123;
      s = "";
    }
    class MySeeThroughComponent extends Component {
      static preset(presets: any, C?: ComponentConstructor<ChildComponent>) {
        // make `child` a bound component, but don't bind `a` here
        // (so it gets bound on the parent component instead)
        let composition = this.presetBoundComponent("child", C!);
        composition.limitBindings("s");
        this.prototype.ChildClass = C!;
        return super.preset(presets, C);
      }
      ChildClass!: ComponentConstructor<ChildComponent>;
      @managedChild child: ChildComponent;
      b = 1;
      s = "ok";
      constructor() {
        super();
        this.child = new this.ChildClass();
      }
    }
    class MyComponent extends Component {
      static preset(presets: any, C?: ComponentConstructor<MySeeThroughComponent>) {
        if (C) this.presetBoundComponent("seeThrough", C);
        this.prototype.C = C;
        return super.preset(presets, C);
      }
      @managedChild seeThrough!: MySeeThroughComponent;
      b = 0;
      s = "no";
      C?: ComponentConstructor<MySeeThroughComponent>;
      makeComponent() {
        if (this.C) this.seeThrough = new this.C();
      }
    }
    const Test = MyComponent.with(
      MySeeThroughComponent.with(ChildComponent.with({ a: bind("b"), s: bind("s") }))
    );
    let c = new Test();
    t.waitAsync(10, () => {
      c.makeComponent();
      c.b = 2; // bound
      c.s = "NO"; // not bound
      c.seeThrough.b = 3; // not bound
      c.seeThrough.s = "OK"; // bound
      t.waitAsync(10, () => {
        t.test(c.seeThrough.child.a === 2 && c.seeThrough.child.s === "OK");
      });
    });
  });

  it("can delegate events", t => {
    class B extends Component {}
    class A extends Component {
      @managed
      @delegateEvents
      b = new B();
      onOK() {
        t.ok();
      }
    }
    new A().b.emit("OK");
  });

  it("can delegate events (reverse)", t => {
    class B extends Component {}
    class A extends Component {
      @delegateEvents
      @managed
      b = new B();
      onOK() {
        t.ok();
      }
    }
    new A().b.emit("OK");
  });

  it("propagates action events", t => {
    class C extends Component {}
    class B extends Component {
      @managed
      @delegateEvents
      c = new C();
    }
    class A extends Component {
      @managed
      @delegateEvents
      b = new B();
      onOK() {
        t.ok();
      }
    }
    new A().b.c.emitAction("OK");
  });
});
