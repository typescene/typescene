# Samples: Http functions
<!-- topic: Http -->
<!-- id: samples/http -->
<!-- sort: 05 -->

Performing a simple GET request with `fetch`:

```typescript
// outputs the content of index.html
App.Http.fetch("/index.html")
    .then(response => {
        if (!response.ok)
            throw new Error("HTTP " + response.status);
        else
            return response.text();
    })
    .then(text => {
        console.log(text);
    });
```

For the example above, `getTextAsync` works too:

```typescript
// outputs the content of index.html
App.Http.getTextAsync("/index.html")
    .then(text => {
        console.log(text);
    });
```

And if you want to parse HTML, use `getHtmlContentAsync`:

```typescript
// appends the content of index.html to the current document
App.Http.getHtmlContentAsync("/index.html")
    .then(fragment => {
        document.body.appendChild(fragment);
    });
```

Sending a POST request using `postAsync` with a JSON payload, and parsing the JSON response:

```typescript
// sends and receives some JSON data
App.Http.postAsync("/api/items", { name: "Bob", foo: "bar" })
    .then(responseData => {
        // output the parsed response
        console.log(responseData);
    });
```

All of the library functions work well with the async/await pattern, too:

```typescript
// sends and receives some JSON data
async function postItemAsync(data) {
    var responseData = await App.Http.postAsync("/api/items", data);

    // ... do something with responseData
    console.log(responseData);
}

postItemAsync({ name: "Bob", foo: "bar" });
```

Finally, you can intercept requests and return mock responses, as well as intercept genuine responses, by connecting to the provided signals: `Requesting` and `Responded`.

```typescript
// intercept all requests before they are sent
App.Http.Requesting.connect(req => {
    // log all requests
    console.log("Requesting: " + req.url);

    // throw an exception if URL is not absolute
    if (!req.url || req.url.charAt(0) !== "/")
        throw new Error("Oops.");

    // send mock response for POST /api/items
    if (req.method === "POST" && req.url === "/api/items") {
        return App.Http.MockResponse.withJSONContent({ foo: "bar" });
    }
});

// redirect /api/items/{x} to /api/test/items/{x}
App.Http.Requesting.connect(req => {
    if (req.url) {
        req.url.replace(/^\/api\/items\/([^\/]+)/,
            "/api/test/items/$1");
    }
});

// take content for "/index.html" from a JSON response
App.Http.Requesting.connect(req => {
    if (req.url === "/index.html") {
        return App.Http.getAsync("/api/test/index").then(data => {
            // take text from a property and fake a response
            return new App.Http.MockResponse(
                { responseText: data.html },
                new App.Http.MockResponseHeaders(
                    "Content-Type: text/html"));
        });
    }
});

// log all (real) response statuses
App.Http.Responded.connect(res => {
    console.log("Response: " + res.status);
    // (`res` is either a real response from `window.fetch`,
    // or a MockResponse created from XMLHttpRequest data)
});
```
