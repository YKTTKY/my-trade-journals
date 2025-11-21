# Migration Guide: Adding Position Direction and Point Value

This guide helps you update your existing database to add the new fields for position direction and point value.

## Prerequisites

- Supabase project set up
- Existing trades table with data
- Access to Supabase SQL Editor

## Step 1: Add New Columns

Run this SQL in your Supabase SQL Editor:

```sql
-- Add position_direction column to track Long/Short positions
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS position_direction TEXT DEFAULT 'long';

-- Add point_value column for futures contract calculations
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS point_value DECIMAL(12, 4) DEFAULT 1;

-- Update all existing trades to have default values
UPDATE trades
SET position_direction = 'long',
    point_value = 1
WHERE position_direction IS NULL OR point_value IS NULL;
```

## Step 2: Verify the Changes

Run this query to verify the new columns were added correctly:

```sql
-- Check the table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'trades'
ORDER BY ordinal_position;
```

You should see:
- `position_direction` with type `text` and default `'long'`
- `point_value` with type `decimal` and default `1`

## Step 3: Update Environment (if needed)

No changes needed to your `.env` file or frontend code. The updated app will automatically use the new fields.

## Step 4: Refresh Your Browser

After running the migration:
1. Stop your development server (Ctrl+C)
2. Run `npm run dev` again
3. Refresh your browser
4. The new Position Direction and Point Value fields should appear

## Troubleshooting

### Issue: "column does not exist" error

If you see errors about missing columns:
- Make sure you ran the ALTER TABLE commands successfully
- Check that the column names match exactly (position_direction, point_value)
- Try refreshing the Supabase dashboard

### Issue: Existing trades don't have the new values

Run this query to backfill missing data:

```sql
-- Backfill any missing values
UPDATE trades
SET position_direction = COALESCE(position_direction, 'long'),
    point_value = COALESCE(point_value, 1)
WHERE position_direction IS NULL OR point_value IS NULL;
```

### Issue: Timezone not showing correctly

Make sure you have all the updated files:
- `src/utils/timezone.js` (new file)
- Updated `src/components/TradeForm.jsx`
- Updated `src/utils/calculations.js`
- Updated page files (Trades.jsx, Dashboard.jsx)

If something is missing, copy it from the latest version of the codebase.

## Rollback (if needed)

If you need to rollback for any reason:

```sql
-- Remove the new columns (this will delete the data in these columns)
ALTER TABLE trades DROP COLUMN IF EXISTS position_direction;
ALTER TABLE trades DROP COLUMN IF EXISTS point_value;
```

**Warning**: This will permanently delete any data stored in these columns.

## Next Steps

1. Test adding a new trade with the Long/Short direction
2. Test adding a futures trade with point value
3. Verify P&L calculations are correct for both directions
4. Check that the timezone displays "Hong Kong Time (UTC+8)"

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs for SQL errors
3. Verify all files are updated correctly
4. Make sure you restarted the development server
