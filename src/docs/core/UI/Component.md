# UI.Component.Animations

See `UI.Animation` class and [`.animations`](~/UI.Component/animations) property for usage details.

# UI.Component/animations

This is a plain array. See `UI.Animation` class for an example.

# UI.Component.with

This method accepts a range of different arguments.

The first argument may be an object (or an [`ObservableObject`](~/Async.ObservableObject)) that contains properties that are copied or bound on to the instantiated component. Some properties are handled intelligently, such as `.style` and signals such as `.Clicked`.

```typescript
UI.Container.with({
    // a normal property value:
    width: "20rem",
    // a bound property (named property on the base component):
    height: UI.bind("containerHeight"),
    // a style property (may also be a `UI.Style` instance):
    style: { background: "#ccc" },
    // an event handler, bound to a method on the base component:
    Clicked: "containerClicked",
    // an event handler, defined inline:
    EnterKeyPressed: new UI.ActionHandler(() => { /* ... */ })
})
```

All (other) arguments may also be either a component reference, a nested component factory, or an observable value that contains a nested component or factory. Even a binding that results in a component _or_ component factory works as an argument:

```typescript
UI.Container.with(
    UI.tl`{h3}Example`,
    UI.bind("isValid", valid => {
        // return a component, factory, or undefined here
        if (valid) return new UI.Label("OK");
        else return UI.Label.withText("Failed");
    })
)
```

Finally, you can also pass in one or more callbacks (at any argument position). These are invoked when the component is created, i.e. instantiated and initialized with any previous arguments. A reference to the base component is passed in as well.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: row -->
```typescript
var row = UI.Row.with(
    { height: "4rem" },
    UI.TextField.withName("nameInput", "", "Enter your name"),
    UI.Button.with((button, base) => {
        button.label = "Say hello";
        button.Clicked.connect(() => {
            var name = base.getFormValues().nameInput;
            App.showMessageBox("Hello, " + name);
        });
    })
)
```

**Note:** In the callback function above, `button` is created and initialized, but not yet added to its parent row, and therefore not accessible through `base`. Neither is the text field. If you need to initialize sub components of the base component after the hierarchy is put together, use a `.Rendered` event handler instead.

# UI.Component/initializeWith

This method allows you to use the component factory syntax from a constructor or any other method, which can be useful if you need to include dynamic values (and want to avoid bindings).

Note that unlike `.with`, this method has only one argument, so use `{ content: [ ... ] }` instead of a list of sub component factories if needed.

### Example
<!-- type: example -->
<!-- displayResult: MyContainer -->
```typescript
class MyContainer extends UI.Container {
    constructor() {
        super();

        var date = new Date().toString();
        this.initializeWith({
            maxContentWidth: "14rem",
            style: { fontStyle: "italic" },
            content: [
                UI.Row.with(
                    { height: "3rem", style: { background: "#ccc" } },
                    UI.tl`Initialized with initializeWith`
                ),
                UI.Paragraph.withText(date)
            ]
        });
    }
}
```
