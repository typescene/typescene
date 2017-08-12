import { Promise, Signal } from "@typescene/core/Async";

// declare fetch function if not defined
var _hasNativeFetch = (typeof (<any>window).fetch === "function");
var _canBlob = (() => {
    try {
        if (typeof Blob !== "undefined" &&
            typeof FileReader !== "undefined" &&
            new Blob([]))
            return true;
    }
    catch (all) { }
    return false;
})();

/** Namespace that encapsulates `.fetch` and related functionality */
export namespace Http {

    /** Configuration options */
    export var config: GlobalConfig = {
        FORCE_XHR_FETCH: false,
        FETCH_INCLUDE_CREDENTIALS: true
    };

    /** Configuration options (for exported `config` variable) */
    export interface GlobalConfig {
        /** Force `fetch` to use XMLHttpRequest instead of native `fetch` implementation (defaults to false) */
        FORCE_XHR_FETCH: boolean,
        /** Automatically set `fetch` credentials mode to "include" (defaults to true) */
        FETCH_INCLUDE_CREDENTIALS: boolean
    };

    /** Signal that is emitted before sending a request; can be used to intercept requests, modify request options, and provide an alternate response; if one of the connected handlers returns a (promise for) an alternate response, i.e. an object that implements `FetchResponse`, then the request will not be sent, and the (first) resulting alternate response is used instead; if one of the connected handlers throws an exception, the original promise for the request is rejected; otherwise the request is sent as per normal */
    export var Requesting = Signal.create<FetchOptions>();

    /** Signal that is emitted after obtaining a remote response (from an actual request, not an alternate response provided by a connected handler of `.Requesting`) */
    export var Responded = Signal.create<FetchResponse>();

    /** Definition of a collection of HTTP headers as an object */
    export interface Headers {
        [headerName: string]: string;
    }

    /** Interface definition for the simple read-only methods of a native Headers instance */
    export interface FetchHeaders {
        /** Returns the first value of a single header by name */
        get(name: string): string;
        /** Returns all values of a single header by name (e.g. `Accept-Encoding`) */
        getAll(name: string): string[];
        /** Returns true if this instance contains the given header */
        has(name: string): boolean;
        /** Returns an iterator that lists all headers by name (polyfill only supports manual iteration with the `next` method for compatibility) */
        keys(): { next(): { done?: boolean, value?: string } };
    }

    /** Interface definition for supported fetch options */
    export interface FetchOptions {
        /** The HTTP method (GET, PUT, POST, DELETE, etc) */
        method?: string;
        /** The URL to send a request to */
        url?: string;
        /** Request headers (object literal or native Headers instance) */
        headers?: Headers | FetchHeaders;
        /** Request body (string, or possibly a Blob if using the native `fetch` implementation) */
        body?: string | Blob;
    }

    /** Interface definition for Response properties available in the native Fetch implementation as well as the polyfill implementation */
    export interface FetchResponse {
        /** Headers returned to the client */
        readonly headers: FetchHeaders;
        /** True if the response was successful (status 200-299) */
        readonly ok: boolean;
        /** Status code of the response */
        readonly status: number;
        /** Status message */
        readonly statusText: string;
        /** Returns a promise for the response body read into a Blob, if supported */
        blob(): PromiseLike<Blob>;
        /** Returns a promise for the response body */
        text(): PromiseLike<string>;
        /** Returns a promise for the response body, parsed as JSON */
        json(): PromiseLike<any>;
    }

    /** Implements the FetchResponse interface, can be used to mock responses or initialize a response from an XMLHttpRequest */
    export class MockResponse implements FetchResponse {
        /** Create a response with given data encoded as JSON, the `application/json` content type, and status 200 */
        public static withJSONContent(data: any) {
            return new MockResponse({ responseText: JSON.stringify(data) },
                new MockResponseHeaders("Content-Type: application/json"));
        }

        /** Create a response with given properties (an XMLHttpRequest object can be passed in directly, along with a native fetch `Headers` instance or a MockResponseHeaders instance); the response itself is taken from `.responseText` if it is not undefined, or from `.response` if it is a Blob */
        constructor(init?: { status?: number, statusText?: string, responseText?: string, response?: Blob },
            headers?: FetchHeaders) {
            if (!init) init = { responseText: "" };
            this._init = init;
            this.status = (init.status !== undefined ? init.status : 200);
            this.ok = this.status >= 200 && this.status < 300;
            this.statusText = init.statusText || "OK";
            this.headers = headers || new MockResponseHeaders();
        }

        /** Headers returned to the client */
        public readonly headers: FetchHeaders;
        /** True if the response was successful (status 200-299) */
        public readonly ok: boolean;
        /** Status code of the response */
        public readonly status: number;
        /** Status message */
        public readonly statusText: string;

        /** Returns a promise for the response body read into a Blob, if supported */
        public blob(): PromiseLike<Blob> {
            if (!_canBlob)
                return Promise.reject(new TypeError());
            else if (!(this._init.response instanceof Blob))
                return Promise.resolve(new Blob([this._init.responseText || ""],
                    { type: this.headers.get("content-type") || "text/plain" }));
            else
                return Promise.resolve(this._init.response);
        }

        /** Returns a promise for the response body */
        public text() { return this._readText() }

        /** Returns a promise for the response body, parsed as JSON */
        public json() { return this._readText().then(s => JSON.parse(s)) }

        /** Helper method that returns a Promise with the text from the constructor initializer (with text in `.responseText`, or a blob in `.response`) */
        private _readText(): PromiseLike<string> {
            try {
                // try to use reponseText property first
                if ((<any>this._init).responseType !== "blob" &&
                    this._init.responseText !== undefined)
                    return Promise.resolve(this._init.responseText);
            }
            catch (all) { }

            // ... otherwise read from response blob
            if (this._init.response instanceof Blob) {
                return new Promise<string>((resolve, reject) => {
                    var fileReader = new FileReader();
                    fileReader.onload = () => resolve(fileReader.result);
                    fileReader.onerror = () => reject(<any>fileReader.error);
                    fileReader.readAsText(this._init.response!);
                });
            }

            return Promise.reject(new Error("Response is neither text nor blob"));
        }

        /** @internal */
        private _init: {
            status?: number,
            statusText?: string,
            responseText?: string,
            response?: Blob
        };
    }

    /** Implements the FetchResponse interface, can be used to mock response headers or initialize response headers from an XMLHttpRequest */
    export class MockResponseHeaders implements FetchHeaders {
        /** Initialize the list of headers using given HTTP header text (i.e. one or more lines with header name, colon, and header value; strips all whitespace around names and values) */
        constructor(allResponseHeaders?: string) {
            // parse all response headers from text
            if (allResponseHeaders) {
                allResponseHeaders.split(/\r\n|\n\r|\r|\n/).forEach(s => {
                    var match = s.match(/^\s+([^:]+):\s*(.*)/);
                    if (match) {
                        var [key, value] = match;
                        key = key.toLowerCase();
                        value = value.replace(/\s+$/, "");
                        if (!this._headers[key]) this._headers[key] = [];
                        this._headers[key].push(value);
                    }
                });
            }
        }

        private _headers: { [id: string]: string[] } = {};

        public get(name: string) {
            name = name.toLowerCase();
            return this._headers[name] && this._headers[name][0];
        }
        public getAll(name: string) {
            name = name.toLowerCase();
            return this._headers[name];
        }
        public has(name: string) {
            name = name.toLowerCase();
            return !!(this._headers[name]);
        }
        public keys() {
            var keys: string[] = [], idx = 0;
            for (var name in this._headers) {
                if (Object.prototype.hasOwnProperty.call(this._headers, name))
                    keys.push(name);
            }
            return {
                next: (): { done?: boolean, value?: string } => {
                    if (idx >= keys.length)
                        return { done: true };
                    else
                        return { done: false, value: keys[idx] };
                }
            };
        }
    }

    /** Perform a request to fetch a resource at given URL; provides a partial polyfill for the Fetch standard using XMLHttpRequest, but uses native `fetch()` internally if available */
    export function fetch(inputUrl: string, init?: FetchOptions):
        PromiseLike<FetchResponse>;

    /** Perform a request to fetch a resource; provides a partial polyfill for the Fetch standard using XMLHttpRequest, but uses native `fetch` internally if available */
    export function fetch(inputRequest: any): PromiseLike<FetchResponse>;

    export function fetch(input: any, init?: any): any {
        var props: FetchOptions;
        if (typeof input === "string") {
            // use init or create new options instance
            props = init || {};
            props.url = input;
        }
        else {
            // use options/Request instance directly
            props = input;
        }

        // include credentials by default
        if (_hasNativeFetch && !(<any>props).credentials &&
            config.FETCH_INCLUDE_CREDENTIALS)
            (<any>props).credentials = "same-origin";

        // return a promise for the remote/mock response
        return new Requesting(props).emit().then(results => {
            // use resulting response, if any
            for (var r of results) if (r) return r;

            // start request
            if (!props.headers) props.headers = {};
            return ((_hasNativeFetch && !config.FORCE_XHR_FETCH) ?
                (<any>window).fetch(props.url!, props) : _xhr(props))
                .then((response: any) => (Responded(response), response));
        });
    }

    /** Helper function for sending a simple request through XMLHttpRequest, returns a promise for the XHR responseText */
    function _xhr(options: FetchOptions) {
        return new Promise<FetchResponse>((resolve, reject) => {
            try {
                // create request and send data
                var xhr = new XMLHttpRequest();
                if (_canBlob) xhr.responseType = "blob";
                xhr.open(options.method || "GET", options.url!, true);
                if (options.headers) {
                    if (typeof (<FetchHeaders>options.headers).keys ===
                        "function") {
                        // get all headers from the native/polyfill Headers object
                        var it = (<FetchHeaders>options.headers).keys();
                        var r: { done?: boolean, value?: string };
                        while ((r = it.next()) && !r.done) {
                            (<FetchHeaders>options.headers).getAll(r.value!)
                                .forEach(v => xhr.setRequestHeader(r.value!, v));
                        }
                    }
                    else {
                        // use headers from a plain object
                        var headers: any = options.headers;
                        for (var key in headers) {
                            if (Object.prototype.hasOwnProperty.call(headers, key))
                                xhr.setRequestHeader(key, headers[key]);
                        }
                    }
                }

                // await response and resolve or reject promise
                xhr.onload = () => {
                    var h = new MockResponseHeaders(xhr.getAllResponseHeaders());
                    resolve(new MockResponse(xhr, h));
                };
                xhr.onerror = () => { reject(new Error("HTTP error")) };
                xhr.ontimeout = () => { reject(new Error("HTTP timeout")) };
                xhr.send(options.body);
            }
            catch (all) {
                reject(all);
            }
        });
    }

    /** Helper function to add an "Accept" header */
    function _headersWithAccept(headers: Headers | FetchHeaders = {},
        accept = "application/json", type = "application/json") {
        if ((typeof (<FetchHeaders>headers).has === "function") &&
            !(<FetchHeaders>headers).has("accept")) {
            if (accept) (<any>headers).append("accept", accept);
            if (type) (<any>headers).append("content-Type", type);
        }
        else if (!(<any>headers)["accept"] && !(<any>headers)["Accept"]) {
            if (accept) (<any>headers)["accept"] = accept;
            if (type) (<any>headers)["content-type"] = type;
        }
        return headers;
    }

    /** Helper function to add query parameters to a URL */
    function _addQueryParams(url: string, params?: any) {
        if (params) {
            var first = (url.indexOf("?") < 0);
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) {
                    url += (first ? "?" : "&") + encodeURIComponent(key)
                        + "=" + encodeURIComponent(params[key]);
                    first = false;
                }
            }
        }
        return url;
    }

    /** Helper function to make a request with a JSON body, that only accepts JSON */
    function _fetchJSON(options: FetchOptions, data?: any) {
        options.headers = _headersWithAccept(options.headers || {});
        if (data === undefined) data = {};
        options.body = JSON.stringify(data);
        return fetch(options).then(response => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.text().then(s => s.length ? JSON.parse(s) : undefined);
        });
    }

    /** Perform a GET request with given parameters and headers, if any; returns a promise that resolves to the response text, or gets rejected if the request fails or response status is not in 2xx range */
    export function getTextAsync(url: string, params?: any,
        headers?: Headers | FetchHeaders) {
        url = _addQueryParams(url, params);
        return fetch(url, { method: "GET", headers }).then(response => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.text();
        });
    }

    /** Perform a GET request with given parameters and headers, if any; returns a promise that resolves to a blob, or gets rejected if the request fails or response status is not in 2xx range; requires a browser that supports Blob constructors */
    export function getBlobAsync(url: string, params?: any,
        headers?: Headers | FetchHeaders) {
        if (!_canBlob) throw new TypeError();
        url = _addQueryParams(url, params);
        return fetch(url, { method: "GET", headers }).then(response => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.blob();
        });
    }

    /** Perform a GET request with given parameters and headers, if any; returns a promise that resolves to the parsed HTML result body as a document fragment (ignores everything before and after body tag, if any; inserts everything if no body tag is found, i.e. partial HTML), or gets rejected if the request fails or response status is not in 2xx range */
    export function getHtmlContentAsync(url: string, params?: any,
        headers?: Headers | FetchHeaders) {
        return getTextAsync(url, params,
            _headersWithAccept(headers, "text/html", ""))
            .then(responseText => {
                // find body tag and keep only its content
                responseText = String(responseText || "");
                var startTag = responseText.match(/<body(?:>|\s[^>]+>)/m);
                if (startTag) {
                    responseText = responseText.slice(
                        startTag.index! + startTag[0].length);
                    var endTagPos = responseText.lastIndexOf("</body>");
                    if (endTagPos >= 0)
                        responseText = responseText.slice(0, endTagPos);
                }

                // set inner HTML of a placeholder element
                var placeholder = document.createElement("div");
                placeholder.innerHTML = responseText;

                // transfer resulting elements to document fragment
                var result = document.createDocumentFragment();
                while (placeholder.firstChild)
                    result.appendChild(placeholder.firstChild);
                return result;
            });
    }

    /** Perform a GET request with given parameters and headers, if any; returns a promise that resolves to the parsed JSON response (or undefined if response was empty), or gets rejected if the request fails or response status is not in 2xx range */
    export function getAsync(url: string, params?: any,
        headers?: Headers | FetchHeaders) {
        return getTextAsync(url, params,
            _headersWithAccept(headers, undefined, ""))
            .then(s => s.length ? JSON.parse(s) : undefined);
    }

    /** Perform a POST request with given object (sent as JSON) and headers, if any; returns a promise that resolves to the parsed JSON response (or undefined if response was empty), or gets rejected if the request fails or response status is not in 2xx range */
    export function postAsync(url: string, data?: any, headers?: Headers) {
        return _fetchJSON({ url, method: "POST", headers }, data);
    }

    /** Perform a PUT request with given object (sent as JSON) and headers, if any; returns a promise that resolves to the parsed JSON response (or undefined if response was empty), or gets rejected if the request fails or response status is not in 2xx range */
    export function putAsync(url: string, data?: any, headers?: Headers) {
        return _fetchJSON({ url, method: "PUT", headers }, data);
    }

    /** Perform a DELETE request with given object (sent as JSON) and headers, if any; returns a promise that resolves to the parsed JSON response (or undefined if response was empty), or gets rejected if the request fails or response status is not in 2xx range */
    export function deleteAsync(url: string, data?: any, headers?: Headers) {
        return _fetchJSON({ url, method: "DELETE", headers }, data);
    }
}