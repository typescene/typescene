# Property bindings
<!-- id: start/ui/bindings/properties -->
<!-- sort: 01 -->

Property bindings can be used to automatically synchronize values of a single property between your component objects and UI components. When passed to a component factory's initializer call (i.e. `.with*(...)` methods), bindings automatically start listening for changes to one or more observable properties, and update another value asynchronously.

## One-way bindings

One-way bindings take observable properties from a component instance, and apply changes directly to a property of any component.

### Binding to a string property
<!-- type: task -->

To make a property observable, use the [`@Async.observable`](~/Async.observable) decorator. Bindings use observables and the `Async.observe` function to operate.

Then, use the `UI.bind` function to supply a binding to any component.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyComponent -->
```typescript
class MyComponent extends UI.CenterRow.with(
    UI.tl`Click for random number:`,
    UI.Button.with({
        label: UI.bind("numDisplay"),
        Clicked: "update"
    })
) {
    @Async.observable
    public numDisplay = "Start!";

    public update() {
        this.numDisplay = (Math.random() * 1000).toFixed(0);
    }
}
```

### UI.bind parameters

The `UI.bind` function takes a string argument, which can take the following forms:

* E.g. `UI.bind("numDisplay")` -- a plain property name, referring to a property on the base component.
* `UI.bind("state.myList.length")` -- the name of a nested property, in this case referring to the `length` property of an array called `myList` which is a property of `state`, which is itself a property of the base component. If any of the intermediate properties do not exist, the bound value is simply `undefined` and no error occurs.
* `UI.bind("getValue()")`, i.e. the name of a (nested) method. This takes its value from the method call result. You cannot specify any parameters. If this method in turn uses any observable properties, it is called again to get an updated value whenever one or more of the observable values change (asynchronously).
* A negated boolean expression, e.g. `UI.bind("!getList().length")`.

Note that you can't pass an arbitrary expression into the `UI.bind` function.

You can also pass a second argument to the `UI.bind` function -- a callback function that takes the (observed) value as its argument, and may return another value altogether to be used instead.

### Providing an empty state using a binding
<!-- type: task -->

You can bind to the `hidden` property of a container or block to show or hide an 'empty state' based on the presence (value or length) of some data referenced by the base component.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyComponent -->
```typescript
class MyComponent extends UI.Container.with(
    UI.Row.with({
        content: [UI.tl`There are no numbers in your list`],
        hidden: UI.bind("items.length")
    }),
    UI.List.with({ items: UI.bind("items") }),
    UI.Button.withLabel("Add number", "addItem")
) {
    @Async.observable
    public items: UI.Row[] = [];

    public addItem() {
        var s = (Math.random() * 1000).toFixed(0);
        var row = new UI.Row();
        this.items.push(row);
        row.appendChild(new (UI.Label.withText(String(this.items.length))));
        row.appendChild(new (UI.Label.withText(s)));
    }
}
```


## Two-way bindings

An even more powerful concept than one-way binding is two-way binding. Values that are bound using this method are synchronized in both directions: if the value of a component's property changes, this value is also written _back_ to the bound property of the base component.

Use the `UI.bind2` function to create a two-way binding, and use it with a component factory in the same way as `UI.bind`. This function supports two separate 'transformation' callbacks: one for transforming the source value to a destination value, and one for transforming the value the other way around.

Two-way bindings do _not_ support function calls using string arguments ending with `"()"`, but nesting and negation is supported.

### Binding input field values
<!-- type: task -->

The most common purpose for two-way bindings, is to mirror the value of an input field on to a property of the base component. We can even use this to synchronize multiple inputs, as in the example below.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyComponent -->
```typescript
class MyComponent extends UI.Row.with(
    UI.TextField.with({
        value: UI.bind2("textValue"),
        immediateValueUpdate: true
    }),
    UI.Icon.withIcon("fa-exchange"),
    UI.TextField.with({
        value: UI.bind2("textValue"),
        immediateValueUpdate: true
    })
) {
    @Async.observable
    public textValue = "Bound";
}
```
