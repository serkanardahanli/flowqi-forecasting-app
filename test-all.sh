#!/bin/bash

# Comprehensive test script for FlowQi
echo "=== FlowQi Comprehensive Test ==="

# Test Supabase configuration
echo -e "\n=== Testing Supabase Configuration ==="
./test-supabase-config.sh

# Test Exact API
echo -e "\n=== Testing Exact API ==="
./test-exact-api-with-token.sh

# Test Exact webhook
echo -e "\n=== Testing Exact Webhook ==="
read -p "Do you want to test Exact webhook? (y/n): " TEST_WEBHOOK
if [ "$TEST_WEBHOOK" = "y" ]; then
  ./test-exact-webhook.sh
fi

# Test ngrok configuration
echo -e "\n=== Testing ngrok Configuration ==="
read -p "Do you want to test ngrok configuration? (y/n): " TEST_NGROK
if [ "$TEST_NGROK" = "y" ]; then
  ./setup-ngrok.sh
fi

# Restart the application
echo -e "\n=== Restarting the Application ==="
read -p "Do you want to restart the application? (y/n): " RESTART_APP
if [ "$RESTART_APP" = "y" ]; then
  ./restart-app.sh
fi

echo -e "\n=== Test Completed ==="
echo "Please check the results above for any errors."
echo "If you encounter any issues, refer to the TESTING.md file for more information." 