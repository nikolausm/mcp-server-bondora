import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function withServer(t) {
  const client = new Client({ name: 'bondora-protocol-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', fileURLToPath(new URL('./mock-bondora.mjs', import.meta.url)), fileURLToPath(new URL('../dist/index.js', import.meta.url))],
    env: { PATH: process.env.PATH, BONDORA_CLIENT_ID: 'synthetic-id', BONDORA_CLIENT_SECRET: 'synthetic-secret', BONDORA_ACCESS_TOKEN: 'synthetic-token' },
    stderr: 'pipe',
  });
  t.after(async () => client.close());
  await client.connect(transport);
  return client;
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert.notEqual(result.isError, true);
  const response = JSON.parse(result.content[0].text);
  assert.equal(response.mocked, true);
  return response;
}

test('all ten tool schemas and pagination defaults remain available over stdio', async t => {
  const client = await withServer(t);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name), [
    'get_account_balance', 'get_investments', 'get_auctions', 'make_bid', 'get_bids',
    'get_secondary_market', 'buy_secondary_market', 'sell_secondary_market', 'cancel_secondary_market', 'get_event_log',
  ]);
  const required = { make_bid: ['auctionId', 'amount'], buy_secondary_market: ['itemId'], sell_secondary_market: ['loanPartId'], cancel_secondary_market: ['itemIds'] };
  for (const tool of tools) assert.deepEqual(tool.inputSchema.required ?? [], required[tool.name] ?? []);
  for (const name of ['get_investments', 'get_auctions', 'get_bids', 'get_secondary_market', 'get_event_log']) {
    const response = await call(client, name);
    assert.equal(response.method, 'get');
    assert.deepEqual(response.params, { PageSize: 100, PageNr: 1 });
    assert.equal(response.body, null);
  }
  assert.equal((await call(client, 'get_account_balance')).route, '/account/balance');
  assert.deepEqual((await call(client, 'get_investments', { pageSize: 5, pageNr: 2 })).params, { PageSize: 5, PageNr: 2 });
});

test('financial write tools retain their methods and payloads through a mock adapter', async t => {
  const client = await withServer(t);
  for (const [name, args, route, body] of [
    ['make_bid', { auctionId: 'synthetic-auction', amount: 25 }, '/bid/synthetic-auction/25', null],
    ['buy_secondary_market', { itemId: 'synthetic-item' }, '/secondarymarket/buy/synthetic-item', null],
    ['sell_secondary_market', { loanPartId: 'synthetic-loan', desiredDiscountRate: 2 }, '/secondarymarket/sell', { LoanPartId: 'synthetic-loan', DesiredDiscountRate: 2 }],
    ['cancel_secondary_market', { itemIds: ['synthetic-item'] }, '/secondarymarket/cancel', { ItemIds: ['synthetic-item'] }],
  ]) {
    const response = await call(client, name, args);
    assert.equal(response.method, 'post');
    assert.equal(response.route, route);
    assert.deepEqual(response.body, body);
    assert.equal(response.params, null);
  }
});

test('invalid inputs are rejected before any HTTP adapter call', async t => {
  const client = await withServer(t);
  for (const [name, args] of [
    ['make_bid', { auctionId: 'synthetic-auction', amount: '25' }],
    ['buy_secondary_market', {}], ['cancel_secondary_market', { itemIds: [123] }],
  ]) assert.equal((await client.callTool({ name, arguments: args })).isError, true);
  assert.equal((await call(client, 'get_account_balance')).count, 1);
});

test('authentication failures preserve the existing caller-facing error', async t => {
  const client = await withServer(t);
  const result = await client.callTool({ name: 'make_bid', arguments: { auctionId: 'auth-failure', amount: 25 } });
  assert.match(result.content[0].text, /Authentication failed/);
  assert.doesNotMatch(result.content[0].text, /synthetic-token|synthetic-secret/);
});
