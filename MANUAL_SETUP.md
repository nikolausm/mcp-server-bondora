# Bondora API Setup - Schritt für Schritt

## 1. Bondora Application erstellen

1. Gehe zu: https://www.bondora.com
2. Logge dich ein
3. Gehe zu: https://www.bondora.com/Application
4. Klicke auf "Create new application"
5. Fülle das Formular aus:
   - **Name**: MCP Integration (oder beliebig)
   - **Description**: MCP Server für AI Integration
   - **Website**: https://localhost
   - **Redirect URI**: https://localhost:3000/callback
6. Klicke auf "Save"
7. **WICHTIG**: Notiere dir:
   - Client ID
   - Client Secret

## 2. OAuth Authorization

### Option A: URL Generator verwenden

```bash
cd /Users/michaelnikolaus/bondora-mcp-server
./generate-oauth-url.sh
```

### Option B: Manuelle URL

Ersetze `DEINE_CLIENT_ID` mit deiner tatsächlichen Client ID:

```
https://www.bondora.com/oauth/authorize?client_id=DEINE_CLIENT_ID&scope=BidsRead%20BidsEdit%20Investments%20SmBuy%20SmSell&response_type=code&redirect_uri=https://localhost:3000/callback
```

## 3. Authorization Code erhalten

1. Öffne die OAuth URL in deinem Browser
2. Logge dich bei Bondora ein (falls nötig)
3. Klicke auf "Authorize" um die Permissions zu gewähren
4. Du wirst zu einer URL weitergeleitet die so aussieht:
   ```
   https://localhost:3000/callback?code=AUTHORIZATION_CODE_HIER
   ```
5. **Kopiere den Code** (alles nach `code=`)

## 4. Access Token erhalten

### Mit cURL (Terminal):

```bash
curl -X POST https://api.bondora.com/oauth/access_token \
  -F grant_type=authorization_code \
  -F client_id=DEINE_CLIENT_ID \
  -F client_secret=DEIN_CLIENT_SECRET \
  -F code=DEIN_AUTHORIZATION_CODE \
  -F redirect_uri=https://localhost:3000/callback
```

### Oder mit dem Token Exchange Script:

Erstelle eine Datei `exchange-token.sh`:

```bash
#!/bin/bash

read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET
read -p "Authorization Code: " CODE

curl -X POST https://api.bondora.com/oauth/access_token \
  -F grant_type=authorization_code \
  -F client_id=$CLIENT_ID \
  -F client_secret=$CLIENT_SECRET \
  -F code=$CODE \
  -F redirect_uri=https://localhost:3000/callback
```

## 5. Claude Desktop konfigurieren

Wenn du den Access Token hast, update die Datei:
`~/Library/Application Support/Claude/claude_desktop_config.json`

Füge im "mcpServers" Abschnitt hinzu:

```json
"bondora": {
  "command": "node",
  "args": ["/Users/michaelnikolaus/bondora-mcp-server/dist/index.js"],
  "env": {
    "BONDORA_CLIENT_ID": "deine_client_id_hier",
    "BONDORA_CLIENT_SECRET": "dein_client_secret_hier",
    "BONDORA_ACCESS_TOKEN": "dein_access_token_hier"
  }
}
```

## 6. Claude Desktop neu starten

Beende Claude Desktop komplett und starte es neu.

## Troubleshooting

### Browser öffnet sich nicht
- Kopiere die URL manuell und öffne sie im Browser

### "Invalid redirect URI" Fehler
- Stelle sicher dass die Redirect URI in deiner App genau `https://localhost:3000/callback` ist

### "Invalid client" Fehler
- Überprüfe Client ID und Secret
- Stelle sicher dass die App aktiv ist

### Token Exchange fehlschlägt
- Der Authorization Code ist nur kurz gültig (wenige Minuten)
- Jeder Code kann nur einmal verwendet werden
- Generiere einen neuen Code wenn nötig