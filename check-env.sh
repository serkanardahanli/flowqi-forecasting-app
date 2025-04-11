#!/bin/bash

# Script to check environment variables
echo "=== Checking Environment Variables ==="

# Check Supabase environment variables
echo -e "\n=== Supabase Environment Variables ==="
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL: Not set"
else
  echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: Not set"
else
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:8}..."
fi

# Check Exact environment variables
echo -e "\n=== Exact Environment Variables ==="
if [ -z "$EXACT_CLIENT_ID" ]; then
  echo "EXACT_CLIENT_ID: Not set (Default: 4b311ef8-c54e-479d-8dc0-855d2627c462)"
else
  echo "EXACT_CLIENT_ID: $EXACT_CLIENT_ID"
fi

if [ -z "$EXACT_CLIENT_SECRET" ]; then
  echo "EXACT_CLIENT_SECRET: Not set"
else
  echo "EXACT_CLIENT_SECRET: ${EXACT_CLIENT_SECRET:0:8}..."
fi

if [ -z "$EXACT_WEBHOOK_SECRET" ]; then
  echo "EXACT_WEBHOOK_SECRET: Not set (Default: 1BcVfXK1NK05B50X)"
else
  echo "EXACT_WEBHOOK_SECRET: ${EXACT_WEBHOOK_SECRET:0:5}..."
fi

# Check ngrok environment variables
echo -e "\n=== ngrok Environment Variables ==="
if [ -z "$NGROK_AUTH_TOKEN" ]; then
  echo "NGROK_AUTH_TOKEN: Not set"
else
  echo "NGROK_AUTH_TOKEN: ${NGROK_AUTH_TOKEN:0:8}..."
fi

echo -e "\n=== Environment Variables Check Completed ===" 