const debugFactory = require('debug');
const nodeFetch = require('node-fetch');

const exponential = delay => (attempts => (attempts * attempts) * delay);

function backoffFetch(config = {}) {
  const {
    delay = 10 * 1000,
    retries = 5,
    isOK = resp => resp.ok,
    shouldRetryError = () => true,
  } = config;

  const internalFetch = config.fetch || nodeFetch;
  const timeout = (typeof delay === 'function') ? delay : exponential(delay);

  let attempts = 0;
  function retry(url, options) {
    attempts += 1;

    return new Promise((resolve, reject) => setTimeout(
      () => fetch(url, options).then(resolve, reject),
      timeout(attempts),
    ));
  }

  function fetch(url, options = {}) {
    const method = options.method || 'GET';
    const debug = debugFactory(`backoff-fetch:${options.requestId||method} to ${url}`);

    return internalFetch(url, options)
      .then((resp) => {
        const extraText = options.extraText ? ` (${options.extraText(resp)})` : '';

        if (attempts >= retries) {
          resp.text().then((text) => {
            debug(`Too many retries, giving up. [HTTP ${resp.status}]${extraText} - ${text}`);
          });
          return resp;
        }

        if (isOK(resp)) {
          debug(`Successful response after ${attempts + 1} attempts. [HTTP ${resp.status}]${extraText}`);
          return resp;
        }

        resp.text().then((text) => {
          debug(`Not successful, backing off. ${retries - attempts} attempts left. Waiting for ${timeout(attempts+1)}. \
[HTTP ${resp.status}]${extraText} - ${text}`);
        });
        return retry(url, options);
      })
      .catch((error) => {
        if (attempts >= retries) {
          debug(`Did not succeed within ${retries} retries`);
          throw error;
        }

        if (!shouldRetryError(error)) {
          debug('Should not retry, giving up');
          throw error;
        }

        return retry(url, options);
      });
  }

  return fetch;
}

backoffFetch.exponential = exponential;
module.exports = backoffFetch;
