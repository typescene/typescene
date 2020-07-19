import {
  managed,
  ManagedMap,
  ManagedObject,
  observe,
  onPropertyEvent,
  ManagedEvent,
} from "../../../dist";

consider("ManagedMap", () => {
  it("can create an empty map", t => {
    let map = new ManagedMap();
    t.test(map.keys().length === 0);
  });

  it("can add items", t => {
    let map = new ManagedMap();
    map.set("1", new ManagedObject());
    map.set("2", new ManagedObject());
    map.set("3", new ManagedObject());
    t.assert(map.has("3"));
    t.test(map.objects().length === 3);
  });

  it("can remove items", t => {
    let map = new ManagedMap();
    let o1 = new ManagedObject();
    let o2 = new ManagedObject();
    let o3 = new ManagedObject();
    map.set("1", o1);
    map.set("2", o2);
    map.set("3", o3);
    map.remove(o1);
    map.unset("3");
    t.test(map.keys().length === 1 && map.objects().length === 1);
  });

  it("can be observed", t => {
    let changes = 0;
    class Group extends ManagedObject {
      @managed map = new ManagedMap();
      @observe static GroupObserver = class {
        onMapChange() {
          changes++;
        }
      };
    }
    let g = new Group();
    let o1 = new ManagedObject();
    let o2 = new ManagedObject();
    g.map.set("1", o1);
    g.map.set("2", o2);
    g.map.unset("1");
    t.test(changes === 4);
  });

  it("can propagate events", t => {
    class Group extends ManagedObject {
      @managed map = new ManagedMap().propagateEvents();
    }
    class GroupObserver {
      @onPropertyEvent("map")
      handler(_map: ManagedMap, e: ManagedEvent) {
        if (e.name === "Foo") t.count(3);
      }
    }
    Group.addObserver(GroupObserver);
    let g = new Group();
    g.map.set("1", new ManagedObject());
    g.map.set("2", new ManagedObject());
    g.map.set("3", new ManagedObject());
    g.map.forEach((_key, item) => item.emit("Foo"));
  });
});
