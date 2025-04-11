#!/bin/bash

# Test script for Exact webhook
# Usage: ./test-exact-webhook.sh

# Exact client ID and webhook secret
EXACT_CLIENT_ID="4b311ef8-c54e-479d-8dc0-855d2627c462"
EXACT_WEBHOOK_SECRET="1BcVfXK1NK05B50X"

echo "Testing Exact webhook configuration..."
echo "Using client ID: $EXACT_CLIENT_ID"
echo "Using webhook secret: ${EXACT_WEBHOOK_SECRET:0:5}..."

# Create a sample webhook payload
echo -e "\nSample webhook payload:"
cat << EOF
{
  "clientId": "$EXACT_CLIENT_ID",
  "eventType": "test",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "data": {
    "test": "This is a test webhook payload"
  }
}
EOF

echo -e "\n\nTo test the webhook, you can use curl:"
echo "curl -X POST http://localhost:3001/api/webhooks/exact \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"X-Exact-Webhook-Secret: $EXACT_WEBHOOK_SECRET\" \\"
echo "  -d '{\"clientId\":\"$EXACT_CLIENT_ID\",\"eventType\":\"test\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"data\":{\"test\":\"This is a test webhook payload\"}}'"

echo -e "\n\nTest completed." 