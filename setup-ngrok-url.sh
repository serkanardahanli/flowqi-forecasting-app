#!/bin/bash

# Check if ngrok is running
if ! pgrep -x "ngrok" > /dev/null; then
  echo "Ngrok is not running. Starting ngrok..."
  ngrok http 3001 &
  sleep 5  # Wait for ngrok to start
fi

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*')

if [ -z "$NGROK_URL" ]; then
  echo "Failed to get ngrok URL. Make sure ngrok is running."
  exit 1
fi

echo "Ngrok URL: $NGROK_URL"

# Update .env.local file
if [ -f .env.local ]; then
  # Check if NEXT_PUBLIC_NGROK_URL already exists
  if grep -q "NEXT_PUBLIC_NGROK_URL" .env.local; then
    # Replace the existing value
    sed -i '' "s|NEXT_PUBLIC_NGROK_URL=.*|NEXT_PUBLIC_NGROK_URL=$NGROK_URL|" .env.local
  else
    # Add the new value
    echo "NEXT_PUBLIC_NGROK_URL=$NGROK_URL" >> .env.local
  fi
  echo "Updated .env.local with ngrok URL"
else
  # Create .env.local file
  echo "NEXT_PUBLIC_NGROK_URL=$NGROK_URL" > .env.local
  echo "Created .env.local with ngrok URL"
fi

echo "Setup complete. You can now use the ngrok URL for Exact Online callbacks."
echo "Make sure to add this URL to your Exact Online app settings:"
echo "$NGROK_URL/api/exact/callback" 