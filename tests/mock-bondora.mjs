import assert from 'node:assert/strict';
import axios from 'axios';

let count = 0;
const reads = new Set(['/account/balance', '/account/investments', '/auctions', '/bids', '/secondarymarket', '/eventlog']);
const writes = new Set(['/bid/synthetic-auction/25', '/secondarymarket/buy/synthetic-item', '/secondarymarket/sell', '/secondarymarket/cancel']);

// Replace the adapter before importing the server: no request can reach Bondora.
axios.defaults.adapter = async config => {
  const url = new URL(config.url);
  assert.equal(url.origin, 'https://api.bondora.com');
  assert.equal(config.headers.Authorization, 'Bearer synthetic-token');
  const route = url.pathname.replace(/^\/api\/v1/, '');
  count++;
  if (route === '/bid/auth-failure/25') {
    const error = new Error('Synthetic unauthorized response');
    error.response = { status: 401 };
    throw error;
  }
  assert.ok(config.method === 'get' ? reads.has(route) : config.method === 'post' && writes.has(route), 'Unexpected mocked route');
  return {
    status: 200, statusText: 'OK', headers: {}, config,
    data: { mocked: true, count, method: config.method, route, params: config.params ?? null, body: config.data ? JSON.parse(config.data) : null },
  };
};
