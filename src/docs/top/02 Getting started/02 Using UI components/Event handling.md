# Event handling
<!-- id: start/ui/events -->
<!-- sort: 03 -->

<!-- ## -->
<!-- type: intro -->
Handle user input and reflect state changes by connecting to event signals.

## Responding to events

Providing feedback to users is one of the most important jobs of the UI. Sometimes this happens when the internal state of your application changes, and sometimes feedback follows user input.

For example, you may want to show and hide part of the UI based on the state of a control element. In the sample below, the text field is always visible -- but by handling the event _signals_ that are emitted by the checkbox component it would be possible to show and hide the text field as needed.

The following example _doesn't_ use event handling.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: * -->
```typescript
UI.Container.with(
    UI.Checkbox.with({ label: "Provide alias", checked: true }),
    UI.Row.with(UI.TextField.with({ placeholderText: "Enter customer alias" }))
)
```

### Using event signals
<!-- type: task -->
All components expose events as [`Signal`](~/Async.Signal) properties that you can connect to. These signals are emitted as a result of user actions or other events (learn more about signals in the articles about the [Async module](~/start/async)).

Conceptually, this is how it works:

```typescript
// connect to the `Clicked` signal with a simple callback:
checkbox.Clicked.connect(() => {
    // ... every time the checkbox is clicked
    row.hidden = !checkbox.checked;
});
```

### Using events on a component factory
<!-- type: task -->

Event signals are exposed as properties on component _instances_, so connecting to them from a component _factory_ requires a slightly different method.

Along with any other properties passed to the `.with` method, you can include instances of `UI.ActionHandler` (or a specialized type such as `UI.PointerHandler`), which you can create using `new` and a handler method.

```typescript
UI.Checkbox.with({
    checked: true,
    Clicked: new UI.PointerHandler(event => {
        // ...
    })
})
```

Note that the `event` object is usually a DOM event. Using the correct type of handler wrapper (e.g. `UI.PointerHandler`) will automatically infer the type of the event object, and the properties and methods available.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: button -->
```typescript
var button = new (UI.Button.with({
    label: "Click me!",
    Pressed: new UI.PointerHandler(event => {
        var which = event.button;
        button.label = which ? "Button " + which : "Primary";
    })
}));
```

### Using events on a Component class
<!-- type: task -->

When you define your own Component class, you get another option for connecting event handlers: simply pass in the name of a public method to a component factory's properties in the `extends` clause.

This makes our example finally work:

<!-- ## -->
<!-- type: example -->
<!-- displayResult: MyForm -->
```typescript
class MyForm extends UI.Container.with(
    UI.Checkbox.with({
        id: "aliasCheckbox",
        label: "Provide alias",
        checked: true,
        Clicked: "aliasCheckboxClicked"  // <== named handler
    }),
    UI.Row.with(
        { id: "aliasRow" },
        UI.TextField.with({ placeholderText: "Enter customer alias" })
    )
) {
    aliasRow: UI.Row;
    aliasCheckbox: UI.Checkbox;

    // checkbox Clicked event handler, referred to by name
    aliasCheckboxClicked() {
        this.aliasRow.hidden = !this.aliasCheckbox.checked;
    }
}
```

## Commonly used events

Nearly all UI events are defined on `UI.Component` itself. These are some of the most commonly used ones.

* **Click/Clicked** (see note below), emitted when the user clicks or otherwise activates a component. Also emitted on e.g. enter press while a button is focused.
* **[_Some_]KeyPressed**, emitted when the user presses a button on the keyboard.
* **Focus/FocusGained**, emitted when a component or one of its sub components gain input focus.
* **Blur/FocusLost**, emitted when input focus is lost.
* **Rendered**, emitted after a component has been rendered (to a DOM element, made available to the event handler) -- but not necessarily displayed on screen.
* **ValueChange/ValueInput**, on input controls after their value changes.

Signals are also used as a higher-level construct, however. A number of components emit signals that don't directly correspond to user events, such as **Closing/Closed** on `DialogContainer`, **SelectionChange** on the `List` component, and **ItemCollapsed** on the `TreeList` component.


## Click vs Clicked
<!-- type: note -->

At this point it's worth noting that component objects expose both a `Click` event and a `Clicked` event (and similarly, there are `Press` and `Pressed`, `Focus` and `FocusGained`, `KeyPress` and `EnterKeyPressed` events etc.).

The difference between handling `Click` (present tense) vs `Clicked` (past tense) is important if you're handling events along the entire component hierarchy.

1. **Click propagates top-down:** The Click event occurs immediately when the user clicks a component. The highest-level parent component's handler is called _first_, and then the event moves down to the target components' `Click` signals.
2. **Clicked is consumed bottom-up:** The Clicked event occurs asynchronously _after_ the Click event. The lowest-level component that has a handler connected to the `Clicked` signal receives the event, and then consumes the event, i.e. it blocks the event from reaching parent components' handlers, even if they are also connected to `Clicked`.

Therefore, you can connect to e.g. `EnterKeyPressed` on a parent component (such as a form container that has multiple rows of controls) to handle the event for all controls -- except for those controls that have a handler connected to `EnterKeyPressed` directly. Even connecting an empty function will block the event from reaching parent components.

Conversely, if you connect to e.g. `Focus` on a parent component, you can be sure that it is invoked first, _before_ the event moves on to any of the (focused) child components.

For consistency, it's a good idea to always use the `Clicked` (past tense) form of event signals where possible.

## Custom event signals

You can easily define your own signals on Component classes, by adding a property that is initialized with a Signal class, i.e. the result of `Async.Signal.create`.

<!-- ## -->
<!-- type: example -->
```typescript
class MyComponent extends UI.Container.with(
    /* ... */
) {
    // define a custom event:
    public MyEvent = Async.Signal.create<string>();
}

var component = new MyComponent();
component.MyEvent.connect(s => { console.log(s) });

component.MyEvent("Triggered!");  // emit the event
```

## Next steps
Instead of explicitly capturing user input and updating parts of your UI manually, you can use _bindings_ to synchronize the values of certain properties automatically.

[{icon::fa-play} Using bindings](~/start/ui/bindings)
