# App.DOMApplication

See also `App.Application`.

## Usage

Find the current application instance, if any, using the static `App.Application.current` property. There can be only one active instance at any time. Calling the constructor twice is not allowed.

To create a basic DOM Application instance and start a root activity, use `new DOMApplication` directly:

```typescript
class MyRootActivity extends UI.RootActivity {
    // ...
}

// start the application
var app = new App.DOMApplication();
app.startActivityAsync(MyRootActivity);
```

To customize the Application class, simply derive from it:

```typescript
class MyApplication extends App.DOMApplication {
    constructor() {
        super("My Application");
        this.startActivityAsync(MyRootActivity);
    }

    // e.g. public properties and methods here...
}

// start the application
new MyApplication();
```
