#!/bin/bash

# Setup script for ngrok
# Usage: ./setup-ngrok.sh

# Prompt for the token
read -p "Enter your ngrok auth token: " NGROK_TOKEN

if [ -z "$NGROK_TOKEN" ]; then
  echo "Error: Ngrok auth token is required"
  exit 1
fi

echo "Setting up ngrok with auth token: ${NGROK_TOKEN:0:10}..."

# Configure ngrok with the auth token
ngrok config add-authtoken $NGROK_TOKEN

echo "Ngrok configured successfully!"
echo "You can now run: ngrok http 3001" 