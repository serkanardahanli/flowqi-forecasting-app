#!/bin/bash

# Script to restart the Next.js application
echo "Stopping any running Next.js processes..."
pkill -f "next dev"

echo "Starting Next.js application..."
npm run dev 