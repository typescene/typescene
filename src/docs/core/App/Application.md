# App.Application

See `App.DOMApplication` for a non-abstract implementation.

## Purpose

The Application object in Typescene plays a major role when dealing with Activities. It keeps track of activities in a stack-like model, automatically activating and suspending activities as they become the topmost item on the activity stack (an instance of `App.ActivityStack`).

* Use the `.startActivityAsync` method to start an activity explicitly, either using an `App.Activity` reference, an `App.Activation` object, or by route (URL path) -- if activities are mapped to routes using the `App.mapRoute` decorator.
* Use the `.dropActivityAsync` method to remove an activity from the stack.
* Use the `.getTopActivity` method to obtain a reference to the current topmost activity.
* Use `.activities` to invoke the `ActivityStack` [.getCursor](~/App.ActivityStack/getCursor) method, which can be used to traverse the activities currently on the stack.

The `.startActivityAsync` method is also aliased as `App.startActivityAsync`.

Additionally, the Application object maintains a reference to the currently active `App.CultureService` in `.culture`, and observes changes to be applied to the UI.

# App.Application/PageNotFound

## Example
```typescript
// Redirect to #/ and log a warning message
App.Application.current.PageNotFound.connect(path => {
    console.log("Page not found: " + path);
    App.startActivityAsync("#/");
})
```
