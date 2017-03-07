# Activity

## See Also
Activities live on an activity stack implemented by [`ActivityStack`](#ActivityStack).

The most frequently used activity stack is part of the [`Application`](#Application) instance, which can be used to start and stop activities.


# Activity.ActivityOptions

## Usage

Set the `.options` property in the constructor of your activity class, to have these options enforced by the activity stack when activated.

```typescript
class MyActivity extends UI.Activity {
    constructor(/* ... */) {
        super();
        this.options.parentActivity = MyParentActivity;
        // ...
    }
}
```

## See Also

To implement a home view activity, derive from [`RootViewActivity`](#RootViewActivity).


# Activity/state

## Example

```typescript
class MyActivity extends UI.RootViewActivity {
    // state object is converted to observable object automatically
    protected state = {
        text: "Hello, world!"
    };

    // use methods to expose the current state (observable)
    public getText() {
        return this.state.text;
    }

    public exclaim() {
        // either set state properties directly:
        this.state.text += "!";

        // ... or use a more functional pattern:
        this.state = {
            text: this.state.text + "!"
        };
    }
}
```