# Playground
<!-- id: start/playground -->
<!-- slug: playground -->
<!-- sort: 99 -->

## Playground
<!-- type: playground -->
<!-- displayResult: View -->

Use the example code below as a starting point for exploring the API. Click "Open code editor" below to get started.

```typescript
class View extends UI.Container.with(
    UI.CenterRow.with(
        UI.tl`The time is: ${UI.bind("timeDisplayed")}`
    )
) {
    constructor() {
        super();
        setInterval(() => {
            var s = this.culture.formatDateTime(new Date(), "%tt");
            this.timeDisplayed = s;
        }, 1000);
    }

    @App.injectService("culture")
    public culture: App.CultureService;

    @Async.observable
    public timeDisplayed = "";
}
```
