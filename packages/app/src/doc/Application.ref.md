# Application

## Usage
This class can either be used directly, or can be used as a base class.

To create a basic Application instance and start a root activity, use `new Application` directly:

```typescript
class MyRootActivity extends UI.RootViewActivity {
    // ...
}

// start the application
var app = new UI.Application();
app.startActivity(MyRootActivity);
```

To customize the Application class, simply derive from it:

```typescript
class MyApplication extends UI.Application {
    constructor() {
        super("My Application");
        this.startActivity(MyRootActivity);
    }

    // now you can use public properties on the instance
    @Async.observable
    public myModel = {
        categories: []  // ...
    };
}

// start the application
new MyApplication();
```

# Application/PageNotFound

## Example
```typescript
// Redirect to #/ and log a warning message
Application.current.PageNotFound.connect(path => {
    console.log("Page not found: " + path);
    Application.startActivity("#/");
})
```