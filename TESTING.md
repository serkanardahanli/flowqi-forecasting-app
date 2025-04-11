# Testing Instructions

This document provides instructions for testing the FlowQi application.

## Comprehensive Testing

You can run all tests at once using the following script:

```bash
./test-all.sh
```

This script will:
1. Test the Supabase configuration
2. Test the Exact API
3. Optionally test the Exact webhook
4. Optionally test the ngrok configuration
5. Optionally restart the application

## Setting Up Environment Variables

You can set up your environment variables using the following script:

```bash
./setup-env.sh
```

This script will prompt you for the necessary environment variables and create/update your `.env.local` file.

## Fixing Import Issues

If you're experiencing issues with the `getBrowserSupabaseClient` function, you can use the following script to update all imports:

```bash
./update-imports.sh
```

This script will find all files that import `getBrowserSupabaseClient` from `@/app/lib/supabase` and update them to import from `@/app/lib/supabase-client` instead.

## Individual Tests

### Supabase Configuration

The Supabase configuration has been updated to include the `getBrowserSupabaseClient` function. If you're still experiencing issues, try restarting the application:

```bash
./restart-app.sh
```

You can also test the Supabase configuration using the following script:

```bash
./test-supabase-config.sh
```

This script will check if your Supabase environment variables are set and test the connection to your Supabase instance.

### Testing the Exact API

To test the Exact API, you need to have a valid OAuth token. You can use the following script:

```bash
./test-exact-api-with-token.sh
```

The script will prompt you to enter your Exact API token.

### Testing the Exact OAuth Flow

To test the Exact OAuth flow, you can use the following script:

```bash
./test-exact-oauth.sh
```

This script will guide you through the OAuth flow, including:
1. Generating an authorization URL
2. Opening the URL in your browser
3. Completing the authorization
4. Exchanging the authorization code for an access token

### Testing the Exact Webhook

To test the Exact webhook functionality, you can use the following script:

```bash
./test-exact-webhook.sh
```

This script will generate a sample webhook payload and provide instructions on how to test the webhook endpoint.

### Setting up ngrok

If you're having issues with ngrok authentication, you can use the following script:

```bash
./setup-ngrok.sh
```

The script will prompt you to enter your ngrok auth token.

After setting up ngrok, you can start a tunnel to your Next.js application:

```bash
ngrok http 3001
```

## Testing the Application

After setting up everything, you can test the application by navigating to:

- `/test-supabase` - To test the Supabase configuration
- `/settings/exact/test` - To test the Exact API integration

If you're still experiencing issues, check the browser console for error messages. 