# Animation

An implementation of this class using CSS keyframe animations is available as `DOMAnimation`.

# DOMAnimation

## Basic Animations
A collection of basic animations is available in the static `.basic` property of this class. The following animations are available:

**`basic.in.`** &mdash; `fade`, `fadeUp`, `fadeDown`, `fadeLeft`, `fadeRight`, `slideUp`, `slideDown`, `slideLeft`, `slideRight`, `scale`, `scaleOver`, `turnX`, `turnY`, `maxHeight`, `maxWidth`

**`basic.in.`** &mdash; `fade`, `fadeUp`, `fadeDown`, `fadeLeft`, `fadeRight`, `slideUp`, `slideDown`, `slideLeft`, `slideRight`, `scale`, `scaleOver`, `turnX`, `turnY`, `maxHeight`, `maxWidth`

**`basic.highlight.`** &mdash; `yellow`, `jumpOut`

## Usage

To apply transitions automatically, use the [`.animations`](#/Component/animations) property of any component:

```typescript
class MyDialog extends UI.DialogContainer {
    constructor(/* ... */) {
        super();
        this.animations.appear = UI.DOMAnimation.basic.in.fade;
        this.animations.disappear = UI.DOMAnimation.basic.out.fade;
        // ...
    }
}
```

For special effects, use the `play`/`playOnce` methods, or the component's `animate` method:

```typescript
var myAnimation = UI.DOMAnimation.basic.highlight.yellow.withTiming(600, 400)
    .togetherWith(UI.DOMAnimation.basic.highlight.jumpOut
        .withTiming(400, 400));
myAnimation.play(someComponent);

// ... or use component:
someComponent.animate(myAnimation);
```