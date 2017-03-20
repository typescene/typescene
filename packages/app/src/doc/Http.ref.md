# Http

This mini-toolkit is provided to simplify development of single-page applications that rely on asynchronous HTTP communication with their Web server. This toolkit library is *not* intended to be a full framework for all types of client-server communication.

However, since most applications won't need much more than simple "Ajax"-style REST requests to transfer HTML or JSON data anyway---and there are no simple ways to achieve this in a cross-browser solution using Promises, the Http toolkit at least provides the basics.

## Exported members
This namespace module exports the following classes and methods:

* `.fetch` function --- mimics the `window.fetch` function in modern browsers. Internally uses either XMLHttpRequest _or_ the native fetch implementation (when available) to process requests and responses, and always returns a Promise for a response object.
* `.getTextAsync` and `.getBlobAsync` --- to perform a GET request and return a Promise for the text or blob response data.
* `.getHtmlContentAsync` --- to perform a GET request and return a Promise for a document fragment that contains everything in the HTML response's `<body>`.
* `.getAsync`, `.postAsync`, `.putAsync`, and `.deleteAsync` --- wrapper functions that send JSON data and return a promise for a parsed JSON response.
* `Http.MockResponse` and `Http.MockResponseHeaders` --- can be used to generate mock responses, and used internally to transform XMLHttpRequest data.
* `Http.Requesting` and `Http.Responded` signals --- for intercepting requests and responses.
* `Http.options` object --- contains options for default behavior of the `fetch` function.

Refer to the [samples](#/samples/http) for common usage patterns.
