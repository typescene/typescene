# Component factories
<!-- id: start/ui/factories -->
<!-- sort: 02 -->

<!-- ## -->
<!-- type: intro -->
Typescene provides a convenient way to represent the static _structure_ of your UI before any of the components are actually created. This is useful when you want to avoid long blocks of code with `new` statements and lots of property assignments.

## Declaring component structures

The `with` method is available on any component class (along with `with*` methods such as `withText` for a label) to create a Component _factory_.

### Creating component factories
<!-- type: task -->

When you create a factory for a container or block component using the static `with*` method(s), you can pass in a list of factories for components that are added as sub components from top to bottom (or left-to-right and/or right-to-left based on language settings).

The first parameter can also be an object that specifies a set of property values, which are applied immediately after creating the component, such as `width` or `style`.

Finally, you can pass a function callback that is called immediately after creating a component, given a reference to the new component itself as well as a reference to the outermost component created by the factory.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyFactory -->
```typescript
// create a component factory from the UI.Container class
var MyFactory = UI.Container.with(
    // automatically wrap single controls in a UI.Row:
    UI.Heading4.withText("Typescene is fun"),
    
    // if you don't need arguments, just pass in a class reference:
    UI.Divider,

    // or use explicit factories through `with(...)` for everything:
    UI.Row.with(
        UI.TextField.with({ placeholderText: "Enter your name" }),
        UI.Button.with({ label: "Say hello" }, (button, base) => {
            // this is called when the button is actually created
            // (more about this callback below...)
            button.Clicked.connect(() => {
                var textField = base.getComponentsByType(UI.TextField)[0];
                var name = textField.value || "there";
                App.showMessageBox(`Hello ${name}, nice to meet you!`);
            });
        })
    )
)
```

<!-- ## -cont'd -->
Note that the result of `UI.Container.with` above is not a `Container` instance, but a factory. This factory can be used to create containers on the fly, _with_ the given set of rows and controls inside (which are also created on the fly, recursively, generating new instances every time).

Thanks to the flexibility of JavaScript this `MyFactory` factory isn't some special 'factory type': the call to `UI.Container.with` actually returns a dynamic `class`. This class derives from `UI.Container` itself. In fact, every `.with` method returns a new _class_ that's based on the class you call this method on. `UI.Row.with` returns a component class that extends `UI.Row`, for example:

```typescript
var MyRow = UI.Row.with({ height: "2rem" });
MyRow.prototype instanceof UI.Row  // => true
```

### Using component factories
<!-- type: task -->

With component factories, you can declare a structure of to-be components, nicely wrapped up into a class that's just like the `UI.Component` class itself. After that, you can create multiple instances of this factory, each with a separate set of sub component instances, using `new`:

```typescript
var form1 = new MyFactory();
var form2 = new MyFactory();
// etc...
```

### Using instance callbacks
<!-- type: task -->

If you pass a _function_ to the `.with` method, it gets invoked as a callback every time an object is created from the resulting factory.

The first argument to the callback will be a reference to the component object itself, and the second argument will be a reference to the base (root) component that's being constructed.

```typescript
var MyFactory = UI.Container.with(
    UI.Label.withText("Container height:"),
    UI.Label.with(
        async (label, base) => {
            await Async.sleep(10);  // wait for DOM
            label.text = base.getActualDimensions().height + "px";
        }
    )
)
```

Note the use of a callback in the first example in this section as well, where the button callback needs a reference to the text field to be able to fetch its value.

This highlights an issue with the nature of factories, and 'lazy' creation of instances.

### Reference issues
<!-- type: note -->

One prominent issue that presents itself when using component factories in your UI is that a factory only _declares_ the structure of components, and you won't have access to the individual component instances **until an instance of the factory is created**. This means having to use callbacks, and methods such as [`getComponentsByType`](~/UI.Component/getComponentsByType) to find sibling components.

To make it easier to cross-reference components, you'll need to write a Component class yourself to get more control over individual instances.


## Creating a Component class

You can start a Component class by extending an existing component class, such as `UI.Container`. Then, initialize sub components manually in the constructor, either by instantiating all of them (e.g. `new UI.Row(...)` for a row of controls), or using the [`initializeWith`](~/UI.Component/initializeWith) method -- which is a lot like `with` but for instances:

```typescript
/** A simple component class that extends UI.Container */
class MyComponent extends UI.Container {
    constructor() {
        super();

        // initialize all content here...?
        this.initializeWith({
            style: { /* ... */ }
            content: [
                UI.Row.with(/* ... */)
                // ... etc.
            ]
        });
    }
}
```

There's nothing wrong with this, but there's an even better way: remember that a component factory is _already_ a class by itself? You can simply extend from the component factory directly, i.e. `class MyComponent extends UI.Container.with(...)`.

### Creating a class from a component factory
<!-- type: task -->

This is the recommended pattern for creating UI components in your Typescene application:

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyComponent -->
```typescript
/** A full-fledged component class that extends a UI.Container factory */
class MyComponent extends UI.Container.with(
    UI.Heading4.withText("Typescene is fun"),
    UI.Row.with(
        UI.TextField.with({
            id: "textField",
            placeholderText: "Enter your name"
        }),
        UI.Button.withLabel("Say hello", "buttonClick")
    )
) {
    // reference to the TextField because it has a matching ID above:
    textField: UI.TextField;

    // event handler, referenced by name from Button.withLabel
    buttonClick() {
        var name = this.textField.value || "there";
        App.showMessageBox(`Hello ${name}, nice to meet you!`);
    }
}
```

<!-- ## -cont'd -->
With component classes that extend component factories, you get the best of both worlds: the structure of your visual hierarchy is clear from the top part (after `extends`), while you can store properties and event handlers right on the component instance once it's been created.

### Using component IDs and properties
<!-- type: task -->

For every component factory in the `extends` clause that specifies an `id` property, your object will contain a property with that same name which automatically refers to the instantiated component.

```typescript
class MyComponent extends UI.Container.with(
    UI.Heading4.with({ id: "h4", text: "Typescene is fun" }),
    UI.Button.with({ id: "myButton", label: "OK" })
) {
    // properties, set automatically by the factory constructor:
    h4: UI.Heading4;
    myButton: UI.Button;
}

var component = new MyComponent();
component.h4.text += " fun fun";
```

### Doubling up
<!-- type: task -->

Now that you know all about component factories, it should be clear why the following actually works, too:

```typescript
// .with(...).with(...)
var MyLabel = UI.Label.withText("Hello")
    .with({ /* more properties here */ });
    
// component class .with(...)
var MyBlueComponent = MyComponent.with({
    style: { background: "blue" }
});
```

## Next steps

Creating your UI components the first time often isn't enough: you'll want to update parts of your UI based on user input, background activities, or the general state of your application.

[{icon::fa-play} Learn how to handle UI events](~/start/ui/events).
