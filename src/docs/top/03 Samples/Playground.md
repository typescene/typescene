# Playground — Hello, world!
<!-- id: samples/hello -->
<!-- sort: 01 -->

Use this minimal example as a starting point for exploring the UI component APIs.

<!-- ## -->
<!-- type: playground -->
<!-- displayResult: View -->
```typescript
/** The container view component */
class View extends UI.Container.with(
    // add UI components here
    UI.CenterRow.with(
        UI.Label.withText("Hello, world!")
    )
) {
    // add properties and event handlers here
    // ...
}
```
