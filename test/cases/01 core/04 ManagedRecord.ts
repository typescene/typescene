import {
  ManagedRecord,
  managedChild,
  ManagedList,
  managed,
  managedDependency,
} from "../../../dist";

consider("ManagedRecord", () => {
  it("can be created without parameters", t => {
    let r = new ManagedRecord();
    if (r) t.ok();
  });

  it("can be created using an object", t => {
    let r = ManagedRecord.create({ a: 123 });
    if (r.a === 123) t.ok();
  });

  it("can be extended and created using an object", t => {
    class MyRecord extends ManagedRecord {
      a?: number;
      b = 123;
    }
    let r = MyRecord.create({ a: 123 });
    if (r.a === r.b) t.ok();
  });

  it("can find the parent record", t => {
    class MyRecord extends ManagedRecord {
      a = 123;
      @managedChild link?: MyRecord;
    }
    let o1 = new MyRecord();
    o1.link = new MyRecord();
    t.assert(o1.link.getParentRecord() === o1);

    class MyRecordB extends ManagedRecord {
      @managedChild link = new MyRecord();
    }
    let o2 = new MyRecordB();
    o2.link.link = new MyRecord();
    t.assert(o2.link.getParentRecord(MyRecordB) === o2);

    class MyListRecord extends ManagedRecord {
      @managedChild list = new ManagedList().restrict(MyRecord);
    }
    let o3 = new MyListRecord();
    let o4 = new MyRecord();
    let o5 = new MyRecord();
    o3.list.add(o4, o5);
    t.assert(o5.getParentRecord() === o3);

    t.ok();
  });

  it("can find sibling records", t => {
    class MyRecord extends ManagedRecord {
      a = 123;
    }

    class MyListRecord extends ManagedRecord {
      @managedChild list = new ManagedList().restrict(MyRecord);
    }
    let o3 = new MyListRecord();
    let o4 = new MyRecord();
    let o5 = new MyRecord();
    o3.list.add(o4, o5);
    t.assert(o5.getPreviousSibling() === o4);
    t.assert(o4.getNextSibling() === o5);
    t.assert(o5.getNextSibling() === undefined);

    t.ok();
  });

  it("can find all referrers", t => {
    class MyRecord extends ManagedRecord {
      a = 123;
    }
    class MyListRecord extends ManagedRecord {
      @managedChild list = new ManagedList().restrict(MyRecord);
    }
    class MyOtherRecord extends ManagedRecord {
      @managed link?: MyRecord;
      @managed link2?: MyRecord;
    }
    class MyDependent extends ManagedRecord {
      @managedDependency ref = new MyRecord();
    }
    let o1 = new MyDependent();
    let o2 = new MyOtherRecord();
    o2.link = o1.ref;
    o2.link2 = o1.ref;
    let o3 = new MyListRecord();
    o3.list.add(o1.ref);

    let refs = o1.ref.getReferrerRecords();
    t.assert(refs.length === 3, "Correct number of refs");
    t.assert(refs.indexOf(o1) >= 0, "Includes dependents");
    t.assert(refs.indexOf(o2) >= 0, "Includes records with lists");
    t.assert(refs.indexOf(o3) >= 0, "Includes parents");
    t.ok();
  });

  it("can be serialized", t => {
    class MyRecordA extends ManagedRecord {
      a = 123;
    }
    class MyRecordB extends MyRecordA {
      b = "123";
    }
    class MyRecordC extends MyRecordB {
      c = true;
      protected _c = true;
    }
    let r = new MyRecordC();
    let s = r.serialize();
    if (s.managedId) t.fail();
    if (s.managedState) t.fail();
    if (s._c) t.fail();
    t.assert(s.a === 123);
    t.assert(s.b === "123");
    t.assert(s.c === true);
    t.ok();
  });

  it("can serialize nested records", t => {
    class MyRecord extends ManagedRecord {
      a = "a";
      @managed
      not = ManagedRecord.create({ not: "serialized" });
      @managedChild
      b = ManagedRecord.create({ c: "c" });
      @managedChild
      list = new ManagedList(
        ManagedRecord.create({ d: "d" }),
        ManagedRecord.create({ d: "D" })
      );
    }
    let r = new MyRecord();
    let s = r.serialize();
    let check = s.a + s.b.c;
    check += s.list.map((a: any) => a.d).join("");
    t.assert(check === "acdD");
    t.assert(!s.not);
    t.ok();
  });
});
