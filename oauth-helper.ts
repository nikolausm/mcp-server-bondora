#!/usr/bin/env node

import readline from 'readline';
import { execFile } from 'node:child_process';
import axios from 'axios';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// OAuth configuration
const OAUTH_BASE_URL = 'https://www.bondora.com/oauth/authorize';
const TOKEN_URL = 'https://api.bondora.com/oauth/access_token';
const SCOPES = ['BidsRead', 'BidsEdit', 'Investments', 'SmBuy', 'SmSell'];

// Helper to read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Main OAuth flow
async function performOAuthFlow() {
  console.log('=== Bondora OAuth Setup ===\n');
  console.log('Dieser Helper hilft dir, einen Access Token für die Bondora API zu erhalten.\n');

  // Step 1: Get Client ID and Secret
  const clientId = await question('Gib deine Bondora Client ID ein: ');
  const clientSecret = await question('Gib dein Bondora Client Secret ein: ');
  const redirectUri = await question('Gib deine Redirect URI ein (default: https://localhost:3000/callback): ') || 'https://localhost:3000/callback';

  // Step 2: Generate authorization URL
  const authorization = new URL(OAUTH_BASE_URL);
  authorization.search = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES.join(' '),
    response_type: 'code',
    redirect_uri: redirectUri,
  }).toString();
  const authUrl = authorization.href;

  console.log('\nÖffne die Authorization URL in deinem Browser...');
  console.log('Falls sie nicht automatisch öffnet, besuche:');
  console.log(authUrl);

  // Try to open browser
  try {
    const opener = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
    await execFileAsync(opener, [authUrl]);
  } catch (error) {
    console.log('Konnte Browser nicht automatisch öffnen.');
  }

  // Step 3: Get authorization code
  console.log('\nNach der Autorisierung wirst du zu deiner Redirect URI weitergeleitet.');
  console.log('Kopiere den "code" Parameter aus der URL.');
  console.log('Beispiel: https://localhost:3000/callback?code=DEIN_CODE_HIER\n');

  const code = await question('Gib den Authorization Code ein: ');

  // Step 4: Exchange code for tokens
  console.log('\nTausche Authorization Code gegen Access Token...');

  try {
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in, scope } = response.data;

    console.log('\n=== Erfolg! ===');
    console.log('Access Token erfolgreich erhalten.\n');
    console.log('Füge diese zu deiner Claude Desktop Konfiguration hinzu:\n');
    
    const config = {
      bondora: {
        command: "node",
        args: ["/Users/michaelnikolaus/bondora-mcp-server/dist/index.js"],
        env: {
          BONDORA_CLIENT_ID: clientId,
          BONDORA_CLIENT_SECRET: clientSecret,          BONDORA_ACCESS_TOKEN: access_token,
          ...(refresh_token && { BONDORA_REFRESH_TOKEN: refresh_token }),
        },
      },
    };
    
    console.log(JSON.stringify(config, null, 2));
    console.log(`\nToken läuft ab in: ${expires_in} Sekunden`);
    console.log(`Gewährte Scopes: ${scope}`);

  } catch (error: any) {
    console.error('\nFehler beim Token-Austausch:');
    console.error(error.response?.data || error.message);
    console.error('\nBitte prüfe deine Zugangsdaten und versuche es erneut.');
  }

  rl.close();
}

// Run the OAuth flow
performOAuthFlow().catch((error) => {
  console.error('Unerwarteter Fehler:', error);
  rl.close();
  process.exit(1);
});
