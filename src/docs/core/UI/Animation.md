# UI.Animation

This class has no implementation. For a DOM-specific implementation, use `UI.DOM.DOMAnimation`.

## Usage

For special effects, use the `.play`/`.playOnce` methods, or the component's [`animate()`](~/UI.Component/animate) method:

```typescript
var myAnimation = UI.DOM.DOMAnimation.basic.highlight.yellow.withTiming(600, 400)
    .togetherWith(UI.DOM.DOMAnimation.basic.highlight.jumpOut
        .withTiming(400, 400));
myAnimation.playOnce(someComponent);

// ... or use component method:
someComponent.animate(myAnimation);
```

To apply transitions automatically, use the [`.animations`](~/UI.Component/animations) property of any component.

## Transitions example
<!-- type: example -->
<!-- displayResult: View -->
```typescript
var animLeft = {
    show: UI.DOM.DOMAnimation.basic.in.fadeLeft.withTiming(500),
    hide: UI.DOM.DOMAnimation.basic.out.fadeLeft.withTiming(1000, 200),
    appear: UI.DOM.DOMAnimation.basic.in.fadeDown,
    disappear: UI.DOM.DOMAnimation.basic.out.fadeUp
}
var animRight = {
    show: UI.DOM.DOMAnimation.basic.in.fadeRight.withTiming(1000),
    hide: UI.DOM.DOMAnimation.basic.out.fadeRight.withTiming(1000),
    appear: UI.DOM.DOMAnimation.basic.in.fadeDown,
    disappear: UI.DOM.DOMAnimation.basic.out.fadeDown
}
class View extends UI.Container.with(
    { height: "15rem" },
    UI.Row.with(
        UI.PrimaryButton.withLabel("Toggle show/hide", "toggle"),
        UI.PrimaryButton.withLabel("Remove all", "removeAll")
    ),
    UI.Container.with(
        { id: "container" },
        UI.Divider.with({
            animations: animRight
        }),
        UI.Row.with(
            { animations: animLeft },
            UI.tl`Example foo bar qux quux ...`
        ),
        UI.Divider.with({
            animations: animLeft
        }),
        UI.Row.with(
            { animations: animRight },
            UI.tl`Example foo bar qux quux ...`
        ),
    )
) {
    container: UI.Container;
    toggle() {
        this.container.content.forEach(c => {
            if (c) c.hidden = !c.hidden;
        });
    }
    removeAll() {
        this.container.content = [];
    }
}
```
