# Playground
<!-- id: playground -->
<!-- sort: 10 -->

Use the example code below as a starting point for exploring the API. Click "Edit this example" on the right below the sample code to get started.

## Edit this code
<!-- type: example -->
<!-- displayResult: View -->
```typescript
class View extends UI.Container {
    @UI.initializer
    static initializer = UI.Container.with({
        content: [
            UI.CenterRow.withContent([
                UI.tl`The time is: ${UI.bind("timeDisplayed")}`
            ])
        ]
    });

    /** Create a View instance */
    constructor() {
        super();
        setInterval(() => {
            this.timeDisplayed = new Date().toTimeString();
        }, 1000);
    }

    @Async.observable
    public timeDisplayed = "";
}
```
