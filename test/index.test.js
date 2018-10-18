const nock = require('nock');
const bfFetch = require('../src/index');

nock.disableNetConnect();
let fetch;

beforeEach(() => {
  fetch = bfFetch();
});

test('plain GET works', () => {
  nock('http://example.com')
    .get('/')
    .reply(200);

  return fetch('http://example.com')
    .then(res => expect(res.status).toEqual(200));
});

test('plain POST works', () => {
  nock('http://example.com')
    .post('/')
    .reply(201);

  return fetch('http://example.com', { method: 'POST' })
    .then(res => expect(res.status).toEqual(201));
});

test('retires until limit', () => {
  nock('http://example.com')
    .get('/').reply(401)
    .get('/').reply(401)
    .get('/').reply(200)
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 2,
  });
  return fetch('http://example.com', { method: 'GET' })
    .then(res => expect(res.status).toEqual(200))
  ;
});

test('fails when over retry limit', () => {
  nock('http://example.com')
    .get('/').reply(500)
    .get('/').reply(500)
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 1,
  });
  return fetch('http://example.com', { method: 'GET' })
    .then(res => expect(res.status).toEqual(500))
  ;
});

test('keeps options for retried requests', () => {
  nock('http://example.com')
    .head('/').reply(502)
    .head('/').reply(202)
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 1,
  });
  return fetch('http://example.com', { method: 'HEAD' })
    .then(res => expect(res.status).toEqual(202))
  ;
});

test('should default retry if errors are thrown', () => {
  nock('http://example.com')
    .get('/').replyWithError({code: 'ETIMEDOUT'})
    .get('/').reply(200)
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 1,
  });
  return fetch('http://example.com')
    .then(res => expect(res.status).toEqual(200))
  ;
});

test('supports custom retry logic for errors', () => {
  nock('http://example.com')
    .get('/').replyWithError({code: 'ETIMEDOUT'})
    .get('/').replyWithError({code: 'ECONNREFUSED'})
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 1,
    shouldRetryError: (error) => {
      return error.code === 'ETIMEDOUT';
    }
  });
  return fetch('http://example.com')
    .catch(error => expect(error.code).toEqual('ECONNREFUSED'))
  ;
});

test('isOK can control retrying', () => {
  nock('http://example.com')
    .get('/').reply(200)
    .get('/').reply(201)
  ;

  fetch = bfFetch({
    delay: 0,
    retries: 1,
    isOK: (res) => res.status === 201,
  });

  return fetch('http://example.com')
    .then(res => expect(res.status).toEqual(201))
  ;
});

test('throw errors', () => {
  nock('http://example.com')
    .get('/').replyWithError({code: 'ETIMEDOUT'})

  const debug = jest.fn();

  fetch = bfFetch({
    shouldRetryError: () => false
  });

  return fetch('http://example.com', {
    debug,
  })
  .catch(error => expect(debug).toBeCalled)
});

test('extra text can be added to the debug output', () => {
  nock('http://example.com')
    .get('/').reply(200);

  const myDebugText = 'My debuging information';
  let debugBuffer = '';

  return fetch('http://example.com', {
    debugText: () => myDebugText,
    debug: (text) => { debugBuffer = text; },
  })
  .then(res => expect(debugBuffer).toContain(myDebugText));
});
