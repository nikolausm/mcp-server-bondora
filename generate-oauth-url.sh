#!/bin/bash

# Bondora OAuth URL Generator

echo "=== Bondora OAuth Setup ==="
echo ""
echo "Dieser Script hilft dir, die OAuth URL zu generieren."
echo ""

read -p "Gib deine Bondora Client ID ein: " CLIENT_ID
read -p "Gib deine Redirect URI ein (Enter für default): " REDIRECT_URI

# Default redirect URI
if [ -z "$REDIRECT_URI" ]; then
    REDIRECT_URI="https://localhost:3000/callback"
fi

# OAuth scopes
SCOPES="BidsRead%20BidsEdit%20Investments%20SmBuy%20SmSell"

# Generate OAuth URL
OAUTH_URL="https://www.bondora.com/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&response_type=code&redirect_uri=${REDIRECT_URI}"

echo ""
echo "=== OAuth Authorization URL ==="
echo ""
echo "Öffne diese URL in deinem Browser:"
echo ""
echo "$OAUTH_URL"
echo ""
echo "Nach der Autorisierung wirst du zu deiner Redirect URI weitergeleitet."
echo "Kopiere den 'code' Parameter aus der URL."
echo ""
echo "Beispiel: https://localhost:3000/callback?code=DEIN_CODE_HIER"
echo ""