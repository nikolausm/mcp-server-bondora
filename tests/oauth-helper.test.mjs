import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

test('OAuth helper opens one URL and preserves special characters in query values', {
  skip: process.platform === 'win32',
  timeout: 10000,
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bondora-oauth-test-'));
  try {
    const captured = join(directory, 'arguments');
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
    await writeFile(join(directory, opener),
      '#!/bin/sh\nprintf \'%s\\n\' "$#" "$1" > "$BONDORA_TEST_CAPTURE"\n', { mode: 0o700 });

    const helper = spawn(process.execPath, ['--import', 'tsx', 'oauth-helper.ts'], {
      env: { PATH: `${directory}${delimiter}${process.env.PATH}`, BONDORA_TEST_CAPTURE: captured },
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const finished = once(helper, 'exit');
    try {
      const output = helper.stdout.setEncoding('utf8')[Symbol.asyncIterator]();
      let prompts = '';
      async function waitFor(prompt) {
        while (!prompts.includes(prompt)) {
          const { value, done } = await output.next();
          assert.ok(!done, `Expected OAuth prompt: ${prompt}`);
          prompts += value;
        }
      }

      const clientId = 'fixture + & " $';
      const redirect = 'https://localhost:3000/callback?first=1&second=2';
      await waitFor('Client ID ein:');
      helper.stdin.write(`${clientId}\n`);
      await waitFor('Client Secret ein:');
      helper.stdin.write('synthetic-secret\n');
      await waitFor('Redirect URI ein');
      helper.stdin.write(`${redirect}\n`);
      // Stop before providing a code, so no token exchange can happen.
      await waitFor('Authorization Code ein:');

      const [argc, argument] = (await readFile(captured, 'utf8')).trimEnd().split('\n');
      assert.equal(argc, '1');
      const url = new URL(argument);
      assert.equal(url.origin, 'https://www.bondora.com');
      assert.equal(url.pathname, '/oauth/authorize');
      assert.equal(url.searchParams.get('client_id'), clientId);
      assert.equal(url.searchParams.get('redirect_uri'), redirect);
      assert.equal(url.searchParams.get('response_type'), 'code');
      assert.equal(url.searchParams.get('scope'), 'BidsRead BidsEdit Investments SmBuy SmSell');
    } finally {
      helper.kill();
      await finished;
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
