# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Applying Migrations

To apply the migrations, you have two options:

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard at https://app.supabase.io
2. Select your project
3. Navigate to the "SQL Editor" section
4. Create a new query
5. Copy and paste the contents of the migration file you want to apply
6. Click "Run" to execute the SQL

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push
```

This will apply all pending migrations.

## Important Migrations

### 20240408_add_calculate_product_performance.sql

This migration adds the `calculate_product_performance` function to the database, which is required for the product dashboard to work correctly. This function calculates product performance metrics based on planned and actual data.

**If you're seeing the error "Could not find the function public.calculate_product_performance(p_month, p_year) in the schema cache", you need to apply this migration.**

## Troubleshooting

If you encounter issues with the migrations:

1. Check the Supabase logs for any errors
2. Verify that the tables referenced in the migrations exist
3. Ensure you have the necessary permissions to create functions
4. If using the CLI, make sure you're connected to the correct project

For more help, refer to the [Supabase documentation](https://supabase.io/docs). 