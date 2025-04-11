#!/bin/bash

# Script to test the Supabase configuration
echo "Testing Supabase configuration..."

# Check if the environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase environment variables are not set"
  echo "Please make sure you have a .env.local file with the following variables:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
  exit 1
fi

echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Supabase Anon Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:8}..."

# Test the Supabase connection
echo "Testing Supabase connection..."
curl -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/sync_logs?limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"

echo -e "\n\nTest completed." 