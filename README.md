## Basic usage example

```js
const fbFactory = require('node-fetch-backoff');
const fetch = fbFactory({
    // Msec or function. Default is exponential delay using msec from this option.
    delay: 10 * 1000,

    // Default is 5 retries before giving up
    retries: 5,

    // Default is a function that reads the ok property of the response object.
    // The function gets passed the response.
    isOK: (resp) => resp.ok,

    // Function that gets the error passed in to deside if it should retry.
    shouldRetryError: (error) => true,

    // The fetch implementation to use. If not provided it will require node-fetch.
    fetch: undefined,
});

// Follows the https://www.npmjs.com/package/node-fetch implementation.
const res = await fetch('/test.json');
```
