import { managedChild, ManagedObject, observe } from "../../../dist";

consider("ManagedObject", () => {
  it("can create an instance", t => {
    t.test(new ManagedObject());
  });

  it("can create a derived class and instance", t => {
    class MyObject extends ManagedObject {}
    let obj = new MyObject();
    t.test(obj);
  });

  it("can be activated asynchronously", async t => {
    let order = "";
    t.failOnTimeout();
    class Foo extends ManagedObject {
      constructor(public n: number) {
        super();
      }
      async onManagedStateActivatingAsync() {
        await super.onManagedStateActivatingAsync();
        order += "A" + this.n;
      }
      async activateAsync() {
        await this.activateManagedAsync();
        order += "B" + this.n;
      }
    }
    let foo1 = new Foo(1);
    let foo2 = new Foo(2);
    let p1 = foo1.activateAsync();
    let p2 = foo2.activateAsync();
    await Promise.all([p1, p2]);
    t.test(order === "A1A2B1B2");
  });

  it("can emit events and handle them", t => {
    t.failOnTimeout();
    class MyObject extends ManagedObject {
      x = "x";
    }
    MyObject.addEventHandler(function (e) {
      t.assert(this.x === "x", "Invoked in instance context");
      if (e.name === "Change") t.ok();
    });
    let obj = new MyObject();
    obj.emitChange();
  });

  it("destroys child objects when parents are destroyed", async t => {
    t.failOnTimeout();
    class MyObject extends ManagedObject {
      @managedChild
      child?: MyChildObject;
      async destroyAsync() {
        await this.destroyManagedAsync();
      }
    }
    class MyChildObject extends ManagedObject {
      async onManagedStateDestroyingAsync() {
        await super.onManagedStateDestroyingAsync();
        t.ok();
      }
    }
    let obj = new MyObject();
    obj.child = new MyChildObject();
    await obj.destroyAsync();
  });

  it("removes references when child objects are destroyed", async t => {
    t.failOnTimeout();
    class MyObject extends ManagedObject {
      @managedChild
      child?: MyChildObject;

      @observe
      static MyObjectObserver = class {
        constructor(public readonly obj: MyObject) {}
        ref?: MyChildObject;
        onChildChange(c: MyChildObject) {
          if (c) this.ref = c;
          if (!c && this.ref) t.ok();
        }
      };
    }
    class MyChildObject extends ManagedObject {
      async destroyAsync() {
        await this.destroyManagedAsync();
      }
    }
    let obj = new MyObject();
    obj.child = new MyChildObject();
    await obj.child.destroyAsync();
  });
});
