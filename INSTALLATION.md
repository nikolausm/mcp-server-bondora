# Bondora MCP Server - Installation abgeschlossen! 🎉

Der Bondora MCP Server wurde erfolgreich installiert in:
`/Users/michaelnikolaus/bondora-mcp-server`

## Nächste Schritte

### 1. Bondora API Zugangsdaten erhalten

Du benötigst jetzt API-Zugangsdaten von Bondora. Es gibt zwei Wege:

#### Option A: OAuth Helper verwenden (empfohlen)

```bash
cd /Users/michaelnikolaus/bondora-mcp-server
npx tsx oauth-helper.ts
```

Der Helper führt dich durch den Prozess.

#### Option B: Manuell

1. Gehe zu https://www.bondora.com und logge dich ein
2. Gehe zu https://www.bondora.com/Application
3. Klicke auf "Create new application"
4. Fülle aus:
   - Name: "MCP Integration"
   - Description: "MCP Server für AI Integration"
   - Website: https://localhost
   - Redirect URI: https://localhost:3000/callback
5. Speichere und notiere Client ID und Client Secret
6. Klicke auf "Test OAuth2 Authorization" um einen Access Token zu erhalten

### 2. Claude Desktop Konfiguration

Sobald du die Zugangsdaten hast, musst du die Claude Desktop Konfiguration aktualisieren.

Die Konfigurationsdatei befindet sich hier:
`~/Library/Application Support/Claude/claude_desktop_config.json`

Füge den folgenden Abschnitt zum "mcpServers" Objekt hinzu:

```json
"bondora": {
  "command": "node",
  "args": ["/Users/michaelnikolaus/bondora-mcp-server/dist/index.js"],
  "env": {
    "BONDORA_CLIENT_ID": "DEINE_CLIENT_ID",
    "BONDORA_CLIENT_SECRET": "DEIN_CLIENT_SECRET",
    "BONDORA_ACCESS_TOKEN": "DEIN_ACCESS_TOKEN"
  }
}
```

### 3. Claude Desktop neu starten

Nach dem Update der Konfiguration musst du Claude Desktop komplett beenden und neu starten.

## Test

Nach dem Neustart kannst du testen mit:
- "Zeige mir meinen Bondora Kontostand"
- "Welche Investments habe ich bei Bondora?"

## Dateien im Projekt

- `src/index.ts` - Hauptserver-Code
- `dist/index.js` - Kompilierter Server (nach npm run build)
- `oauth-helper.ts` - Helper für OAuth Flow
- `package.json` - NPM Konfiguration
- `tsconfig.json` - TypeScript Konfiguration
- `README.md` - Dokumentation

## Bei Problemen

1. Prüfe ob der Server läuft: `node dist/index.js`
2. Schaue in die Console-Logs in Claude Desktop
3. Stelle sicher dass alle Umgebungsvariablen korrekt sind