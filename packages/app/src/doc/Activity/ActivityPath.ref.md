# ActivityResourceMap
## -
> **Note:** This class is used internally by [`Application`](#Application).


# ActivityResourcePath

## Usage

This class enables building resource paths from several parts, and is used internally to match paths against each other.

```typescript
class MyCountersActivity extends UI.SingletonViewActivity {
    constructor() {
        super("Counters", "#/counters");
    }
    // ...
}

class MyCounterActivity extends UI.ViewActivity {
    constructor(id: string, name: string) {
        super(name);

        // concatenate resource path
        this.resourcePath = new ActivityResourcePath(
            MyCountersActivity.getInstance(), id);
    }
    // ...
}
```