#!/bin/bash

# Script to test the Exact OAuth flow
echo "=== Testing Exact OAuth Flow ==="

# Exact client ID
EXACT_CLIENT_ID="4b311ef8-c54e-479d-8dc0-855d2627c462"

# Prompt for the client secret
read -p "Enter your Exact client secret: " EXACT_CLIENT_SECRET

if [ -z "$EXACT_CLIENT_SECRET" ]; then
  echo "Error: Client secret is required"
  exit 1
fi

# Prompt for the redirect URI
read -p "Enter your redirect URI (default: http://localhost:3001/api/auth/callback/exact): " REDIRECT_URI
REDIRECT_URI=${REDIRECT_URI:-http://localhost:3001/api/auth/callback/exact}

# Generate the authorization URL
AUTH_URL="https://start.exactonline.nl/api/oauth2/auth?client_id=$EXACT_CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&force_login=1"

echo -e "\nAuthorization URL:"
echo "$AUTH_URL"

echo -e "\nPlease open this URL in your browser and complete the authorization flow."
echo "After authorization, you will be redirected to your redirect URI with a code parameter."
echo "Copy the code parameter and paste it below."

# Prompt for the authorization code
read -p "Enter the authorization code: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
  echo "Error: Authorization code is required"
  exit 1
fi

# Exchange the authorization code for an access token
echo -e "\nExchanging authorization code for access token..."
curl -X POST "https://start.exactonline.nl/api/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=$EXACT_CLIENT_ID&client_secret=$EXACT_CLIENT_SECRET&code=$AUTH_CODE&redirect_uri=$REDIRECT_URI"

echo -e "\n\nTest completed." 