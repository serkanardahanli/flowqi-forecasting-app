#!/bin/bash

# Script to set up environment variables
echo "=== Setting Up Environment Variables ==="

# Check if .env.local file exists
if [ -f .env.local ]; then
  echo "Found .env.local file. Do you want to update it? (y/n): "
  read UPDATE_ENV
  if [ "$UPDATE_ENV" != "y" ]; then
    echo "Skipping environment setup."
    exit 0
  fi
fi

# Prompt for Supabase environment variables
echo -e "\n=== Supabase Environment Variables ==="
read -p "Enter Supabase URL: " SUPABASE_URL
read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY

# Prompt for Exact environment variables
echo -e "\n=== Exact Environment Variables ==="
read -p "Enter Exact Client ID (default: 4b311ef8-c54e-479d-8dc0-855d2627c462): " EXACT_CLIENT_ID
EXACT_CLIENT_ID=${EXACT_CLIENT_ID:-4b311ef8-c54e-479d-8dc0-855d2627c462}
read -p "Enter Exact Client Secret: " EXACT_CLIENT_SECRET
read -p "Enter Exact Webhook Secret (default: 1BcVfXK1NK05B50X): " EXACT_WEBHOOK_SECRET
EXACT_WEBHOOK_SECRET=${EXACT_WEBHOOK_SECRET:-1BcVfXK1NK05B50X}

# Prompt for ngrok environment variables
echo -e "\n=== ngrok Environment Variables ==="
read -p "Enter ngrok Auth Token: " NGROK_AUTH_TOKEN

# Create or update .env.local file
echo "Creating/updating .env.local file..."
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Exact
EXACT_CLIENT_ID=$EXACT_CLIENT_ID
EXACT_CLIENT_SECRET=$EXACT_CLIENT_SECRET
EXACT_WEBHOOK_SECRET=$EXACT_WEBHOOK_SECRET

# ngrok
NGROK_AUTH_TOKEN=$NGROK_AUTH_TOKEN
EOF

echo -e "\n=== Environment Variables Setup Completed ==="
echo "Your .env.local file has been created/updated."
echo "Please restart your application to apply the changes." 