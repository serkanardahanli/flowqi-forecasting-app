#!/bin/bash

# Test script for Exact API
# Usage: ./test-exact-api.sh YOUR_ACCESS_TOKEN

if [ -z "$1" ]; then
  echo "Error: Access token is required"
  echo "Usage: ./test-exact-api.sh YOUR_ACCESS_TOKEN"
  exit 1
fi

ACCESS_TOKEN=$1

echo "Testing Exact API connection..."
echo "Using access token: ${ACCESS_TOKEN:0:10}..."

# Test the /Me endpoint
echo -e "\nTesting /Me endpoint:"
curl -X GET "https://start.exactonline.nl/api/v1/current/Me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"

# Test the /GLAccounts endpoint
echo -e "\n\nTesting /GLAccounts endpoint:"
curl -X GET "https://start.exactonline.nl/api/v1/current/GLAccounts" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"

echo -e "\n\nTest completed." 