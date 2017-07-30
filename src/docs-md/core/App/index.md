# App
<!-- id: App -->
<!-- typings: ../../../../dist/core/typings/App -->
<!-- typings: ../../../../dist/dom/typings/App -->

The Typescene &lsquo;App&rsquo; sub module defines the necessary constructs to create full featured Web applications.

At the heart of this module is the `Application` class. This is a _singleton_ class, meaning there can only ever be one instance of this class each time the module is loaded.

The primary purpose of the `Application` class is to keep track of a &lsquo;stack&rsquo; (a last-in-first-out list) of `Activity` instances. These can be synchronized with the browser's navigation history, which makes the App module dependent on the browser `window` interface.
