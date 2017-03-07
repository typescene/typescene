# ActionHandler

Use an `ActionHandler` in an initializer to connect to a component's signal, when you do not care about the event object passed in (e.g. DOM mouse event).

```typescript
var buttonFactory = Button.with({
    label: "Click me",
    Press: new UI.ActionHandler(() => {
        // ... do something when pressed
    })
});
```

You can also use an `ActionHandler` as a property, for stronger typing (optional):

```typescript
class CountButton extends UI.Button {
    constructor() { this.Press.connect(this.addUp) }
    public count = 0;
    public addUp = new UI.ActionHandler(() => {
        this.count++;
    });
}
```

However, the following also works, without wrapping the method in an `ActionHandler` instance.

```typescript
class CountButton extends UI.Button {
    constructor(label: string) {
        this.initializeWith({
            label,
            Press: "addUp"
        });
    }
    public count = 0;
    public addUp() { this.count++ }
}
```

# ComponentSignalHandler/connectTo

This method is used by component factories to connect handlers to signals.
