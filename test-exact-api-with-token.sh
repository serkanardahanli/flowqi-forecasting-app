#!/bin/bash

# Test script for Exact API with token
# Usage: ./test-exact-api-with-token.sh

# Exact client ID
EXACT_CLIENT_ID="4b311ef8-c54e-479d-8dc0-855d2627c462"

# Prompt for the token
read -p "Enter your Exact API token: " EXACT_TOKEN

if [ -z "$EXACT_TOKEN" ]; then
  echo "Error: Token is required"
  exit 1
fi

echo "Testing Exact API connection..."
echo "Using client ID: $EXACT_CLIENT_ID"
echo "Using access token: ${EXACT_TOKEN:0:10}..."

# Test the /Me endpoint
echo -e "\nTesting /Me endpoint:"
curl -X GET "https://start.exactonline.nl/api/v1/current/Me" \
  -H "Authorization: Bearer $EXACT_TOKEN" \
  -H "Accept: application/json"

# Test the /GLAccounts endpoint
echo -e "\n\nTesting /GLAccounts endpoint:"
curl -X GET "https://start.exactonline.nl/api/v1/current/GLAccounts" \
  -H "Authorization: Bearer $EXACT_TOKEN" \
  -H "Accept: application/json"

echo -e "\n\nTest completed." 