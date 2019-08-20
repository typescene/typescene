import { managed, ManagedList, ManagedObject, ManagedRecord, observe } from "../../../dist";

consider("ManagedList", () => {
    it("can create an empty list", t => {
        let list = new ManagedList();
        t.test(list.count === 0);
    })

    it("can create a non-empty list", t => {
        let record1 = ManagedRecord.create({ foo: "bar" });
        let record2 = ManagedRecord.create({ foo: "baz" });
        let list = new ManagedList(record1, record2);
        t.test(list.count === 2 &&
            list.get(0).foo === "bar" &&
            list.get(1).foo === "baz");
    })

    it("can add items", t => {
        let list = new ManagedList();
        list.add(new ManagedObject());
        list.add(new ManagedObject());
        list.add(new ManagedObject());
        t.test(list.count === 3);
    })

    it("can remove items", t => {
        let list = new ManagedList();
        let o1 = new ManagedObject();
        let o2 = new ManagedObject();
        let o3 = new ManagedObject();
        list.add(o1, o2, o3);
        list.remove(o1);
        list.remove(o3);
        t.test(list.count === 1 &&
            list.indexOf(o2) === 0);
    })

    it("can be observed", t => {
        let changes = 0;
        class Group extends ManagedObject {
            @managed list = new ManagedList();
            @observe static GroupObserver = class {
                onListChange() { changes++ }
            }
        }
        let g = new Group();
        let o1 = new ManagedObject();
        let o2 = new ManagedObject();
        g.list.add(o1, o2);
        g.list.remove(o1);
        t.test(changes === 4)
    })

    it("can propagate events", t => {
        class Group extends ManagedObject {
            @managed list = new ManagedList().propagateEvents();
        }
        observe(Group).addPropertyEventHandler("list", (_group, _list, e) => {
            if (e.name === "Foo") t.count(3);
        })
        let g = new Group();
        g.list.add(new ManagedObject, new ManagedObject, new ManagedObject);
        g.list.forEach(item => item.emit("Foo"));
    })
})