## Basic usage example

[![Build Status](https://travis-ci.org/birkestroem/node-fetch-backoff.svg?branch=master)](https://travis-ci.org/birkestroem/node-fetch-backoff)
[![Coverage Status](https://coveralls.io/repos/github/birkestroem/node-fetch-backoff/badge.svg?branch=master)](https://coveralls.io/github/birkestroem/node-fetch-backoff?branch=master)


```js
const nfbFactory = require('node-fetch-backoff');
const fetch = nfbFactory({
    // Msec or function. Default is exponential delay using msec from this option.
    delay: 10 * 1000,

    // Default is 5 retries before giving up
    retries: 5,

    // Default is a function that reads the ok property of the response object.
    // The function gets passed the response.
    isOK: (resp) => resp.ok,

    // Function that gets the error passed in to deside if it should retry.
    shouldRetryError: (error) => true,

    // Function that gets the response passed in to deside if it should retry.
    shouldRetryResponse = () => true,

    // The fetch implementation to use. If not provided it will require node-fetch.
    fetch: undefined,
});

// Follows the https://www.npmjs.com/package/node-fetch implementation.
const res = await fetch('/test.json');
```
