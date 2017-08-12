# UI.Page

Use this class to manage the contents of the screen manually (i.e. without `App.Activity` and/or `UI.Screen` methods).

At any time, contents of only a _single_ Page can be visible. Displaying a second page will immediately remove the current page's content off the screen.

### Example
<!-- type: example -->
<!-- displayResult: button -->
```typescript
var docsPage = UI.Page.getCurrentPage()!;
var View = UI.Container.with(
    {
        style: { background: "#ccc" },
        vertAlign: "middle"
    },
    UI.CenterRow.with(
        UI.RoundButton.withIcon("fa-arrow-left",
            new UI.ActionHandler(() => { docsPage.displayAsync() })),
        UI.tl`Hello, world!`
    )
);

var p = new UI.Page();
p.content.push(new View());

var button = new UI.Button("Show page");
button.Clicked.connect(() => {
    p.displayAsync();
});
```