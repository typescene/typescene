# Overview
<!-- docTitle: Typescene App module -->
<!-- id: overview -->
<!-- sort: 01 -->

The Typescene &lsquo;App&rsquo; module defines the necessary constructs to create full featured Web applications.

At the heart of this module is the `Application` class. This is a _singleton_ class, meaning there can only ever be one instance of this class each time the module is loaded.

The primary purpose of the `Application` class is to keep track of a &lsquo;stack&rsquo; (a last-in-first-out list) of `Activity` instances. These can be synchronized with the browser's navigation history, which makes the App module dependent on the browser `window` interface.

To learn how to use Application and Activity classes, refer to the [Architecture](#/overview/architecture) topic.

## What is Typescene?
<!-- type: note -->

This module is part of the Typescene toolkit, a strongly typed front-end toolkit for modern Web applications built with TypeScript. Read more about Typescene on the project's [website](http://typescene.org).

# Architecture
<!-- id: overview/architecture -->
<!-- sort: 01 -->

When deciding on the architecture of your application there are a number of things to consider, such as the way data is communicated to and from the Web server, the way it is stored in the user's browser, and how it is presented on screen by your UI code.

Typescene can help to structure your front end user interface code in a way that is clear and concise, by adhering to a well-defined object oriented pattern. Following this pattern, the entire UI is made up of Component objects, which communicate asynchronously through (observable) properties and Signals. Components are combined in logical ways and presented on a page.

However Components do not define how a user should move from page to page or among modal dialogs, or how the application should store its internal state. This is what the App module and its Activity classes can be used for.

## Dependency inversion

Often, the first step to defining the overall application architecture is to decide on dependencies. Minimizing dependencies in code, especially mutual dependencies, is important for producing code that is easy to understand an maintain.

The Typescene App module is built to support 'inverted' dependencies, i.e. even though the application itself creates activities to manage application state, and activities in turn create and display UI views, the direction of dependencies in code is exactly the other way around.

* Views know about the public API of the activity they are subscribed to, but activities do not depend on specific views;
* Activities know about parent activities, but not the other way around; and
* Activities subscribe to application (URL) routes to eliminate the need for a global routing map that would have to refer to classes across the app's code base.

Using dependency inversion to your advantage, you may even wish to structure your source code such that adding a new feature (activity) to your application would only involve creating a single folder in your code base:

* `./feature-name` --- folder that contains all files for a feature with this name
    * `./feature-name/FeatureActivity.ts` --- activity source, i.e. an implementation of a `ViewActivity` class (and/or other activities), mapped to an application route using `mapToPath` or `mapToResource`
    * `./feature-name/FeatureView.ts` --- main view source, i.e. an implementation of a UI component or page class, mapped to the activity using `mapToActivity` or `mapPageToActivity`
    * `./feature-name/components/...` --- optional, more view classes (sub components) that are used by the main activity view
    * `./feature-name/sub-feature/...` --- optional, sub activities that depend on the feature activity as a parent activity

The only issue with this structure is that tools such as Webpack will not automatically include all files in the build process. This can be solved by recursively including `index.ts` files for all folders, that import all source files in that folder.

## Activities

This section is TBD, to introduce `Activity`, `ViewActivity`, `RootViewActivity` etc.

Examples TBD: implementing an Activity class, looking up Activity classes, and starting activities.

## Keeping track of application state

This section is TBD, to introduce observable state, e.g. through the `Activity#state` property.

Also state vs data models, to explicitly _exclude_ options for representing application models on the client.

## Client-server communication

This section is TBD, to introduce options for client-server communication; with only `Http` (for simple REST-like requests) being a part of the Typescene toolkit.
