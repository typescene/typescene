# Component list binding and animations
<!-- id: samples/bindComponents -->
<!-- sort: 10 -->

The following example shows that the components really are bound to distinct model objects when using `UI.bindComponents`. Components move around visually when the array changes, with some asynchronous animation magic.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: View -->
```typescript
/** Model representation */
class MyNumber {
    constructor(public n: number) { }
}

/** Represents each item in the list of numbers */
class ListItem extends UI.Row.with(
    { spacing: ".5rem", style: { display: "inline-block" } },
    UI.Label.with({
        text: UI.bind("myNumber.n"),
        style: { padding: ".5rem", background: "#ccc" }
    })
) {
    // this constructor is called by `UI.bindComponents`
    constructor(public myNumber: number) {
        super();
        this.animations = { appear: UI.DOM.DOMAnimation.basic.in.fadeDown }
    }
}

/** The container view component */
class View extends UI.Container.with(
    UI.Row.with(
        UI.tl`{h4}Random numbers`,
        UI.Spacer,
        UI.Button.withLabel("Randomize", "randomize"),
        UI.PrimaryButton.withLabel("Shuffle", "shuffle")
    ),
    UI.Divider,
    UI.List.with({
        height: "14rem",
        items: UI.bindComponents("numbers", ListItem, true),
        renderOptions: { animateListItems: 500 }
    })
) {
    /** Create a new view and randomize the array */
    constructor() {
        super();
        this.randomize();
    }
    
    /** An observable array of numbers */
    @Async.observable numbers: MyNumber[];
    
    /** Randomize numbers one by one */
    async randomize() {
        this.numbers = [];
        var a = this.numbers;
        for (var i = 0; i < 10; i++) {
            a.push(new MyNumber(Math.random()));
            await Async.sleep(100);
        }
    }
    
    /** Randomize positions, with a touch of async for effect */
    async shuffle() {
        var a = this.numbers;
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
            await Async.sleep(150);
        }
    }
}
```
