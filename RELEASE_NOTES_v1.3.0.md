# Version 1.3.0 Release Notes

## What's new in version 1.3.0:

- Fixed sidebar time rendering with client-side only approach to prevent hydration errors
- Improved expenses data fetching with fallback to budget_entries table
- Enhanced auth cookie handling in callback route for better auth flow
- Added GL account selection to revenue forms
- Fixed menu structure and navigation
- Added proper error handling for data fetching
- Updated React rendering to avoid hydration warnings

## Changes

- Fixed hydration mismatch issue in Sidebar component
- Added fallback mechanism for expenses fetching
- Updated auth callback to handle cookies correctly
- Fixed navigation issues between budget/revenue and actual/expenses
- Updated package.json version to 1.3.0 