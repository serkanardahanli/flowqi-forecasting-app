#!/bin/bash

# Script to update all imports in the application
echo "=== Updating Imports ==="

# Find all files that import getBrowserSupabaseClient from @/app/lib/supabase
echo "Finding files that import getBrowserSupabaseClient from @/app/lib/supabase..."
FILES=$(grep -r "import.*getBrowserSupabaseClient.*from.*@/app/lib/supabase" --include="*.tsx" --include="*.ts" .)

if [ -z "$FILES" ]; then
  echo "No files found that import getBrowserSupabaseClient from @/app/lib/supabase."
  exit 0
fi

echo "Found the following files:"
echo "$FILES"

# Update each file
echo -e "\nUpdating files..."
echo "$FILES" | while read -r line; do
  FILE=$(echo "$line" | cut -d ':' -f 1)
  echo "Updating $FILE..."
  sed -i '' 's|import { getBrowserSupabaseClient } from '\''@/app/lib/supabase'\''|import { getBrowserSupabaseClient } from '\''@/app/lib/supabase-client'\''|g' "$FILE"
done

echo -e "\n=== Import Update Completed ==="
echo "Please restart your application to apply the changes." 