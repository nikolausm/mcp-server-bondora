# Bondora MCP Server

Model Context Protocol server für die Bondora P2P Lending Platform API.

## Installation

```bash
npm install
npm run build
```

## Konfiguration

### 1. Bondora API Zugangsdaten

1. Logge dich bei [Bondora](https://www.bondora.com) ein
2. Gehe zu [API Applications](https://www.bondora.com/Application)
3. Erstelle eine neue Anwendung
4. Notiere Client ID und Client Secret
5. Führe den OAuth Flow durch für Access Token

### 2. Umgebungsvariablen

Setze folgende Umgebungsvariablen:

```bash
export BONDORA_CLIENT_ID=deine_client_id
export BONDORA_CLIENT_SECRET=dein_client_secret
export BONDORA_ACCESS_TOKEN=dein_access_token
export BONDORA_REFRESH_TOKEN=dein_refresh_token  # Optional
```

### 3. Claude Desktop Integration

Bearbeite `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bondora": {
      "command": "node",
      "args": ["/Users/michaelnikolaus/bondora-mcp-server/dist/index.js"],
      "env": {
        "BONDORA_CLIENT_ID": "deine_client_id",
        "BONDORA_CLIENT_SECRET": "dein_client_secret",
        "BONDORA_ACCESS_TOKEN": "dein_access_token"
      }
    }
  }
}
```

## Verfügbare Tools

- `get_account_balance` - Kontostand abrufen
- `get_investments` - Investments anzeigen
- `get_auctions` - Verfügbare Auktionen
- `make_bid` - Gebot abgeben
- `get_bids` - Eigene Gebote anzeigen
- `get_secondary_market` - Sekundärmarkt durchsuchen
- `buy_secondary_market` - Kauf auf Sekundärmarkt
- `sell_secondary_market` - Verkauf auf Sekundärmarkt
- `cancel_secondary_market` - Verkauf stornieren
- `get_event_log` - Event-Log anzeigen

## Verwendung

Nach der Installation und Konfiguration kannst du in Claude fragen wie:

- "Zeige mir meinen Bondora Kontostand"
- "Welche Investments habe ich?"
- "Gibt es interessante Auktionen?"
- "Kaufe Loan XYZ auf dem Sekundärmarkt"

## Sicherheit

- Teile niemals deine API-Zugangsdaten
- Access Token läuft ab - implementiere Token-Refresh bei Bedarf
- Beachte Bondoras API Rate Limits

## Support

Bei Problemen prüfe:
- [Bondora API Dokumentation](https://api.bondora.com)
- Server-Logs in der Konsole
- Umgebungsvariablen korrekt gesetzt?