# Supabase SQL Setup

Run this SQL in your Supabase SQL Editor to set up the database schema:

```sql
-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  position_direction TEXT DEFAULT 'long',
  asset_symbol TEXT NOT NULL,
  entry_price DECIMAL(12, 4) NOT NULL,
  exit_price DECIMAL(12, 4) NOT NULL,
  position_size DECIMAL(12, 4) NOT NULL,
  point_value DECIMAL(12, 4) DEFAULT 1,
  stop_loss DECIMAL(12, 4),
  take_profit DECIMAL(12, 4),
  fees DECIMAL(12, 4) DEFAULT 0,
  trade_date TIMESTAMPTZ NOT NULL,
  pnl DECIMAL(12, 4),
  pnl_percentage DECIMAL(12, 4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  emoji TEXT DEFAULT '🏷️',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create trade_tags junction table
CREATE TABLE IF NOT EXISTS trade_tags (
  id BIGSERIAL PRIMARY KEY,
  trade_id BIGINT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_id, tag_id)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON trades (user_id);
CREATE INDEX IF NOT EXISTS trades_trade_date_idx ON trades (trade_date);
CREATE INDEX IF NOT EXISTS trades_asset_symbol_idx ON trades (asset_symbol);
CREATE INDEX IF NOT EXISTS tags_user_id_idx ON tags (user_id);
CREATE INDEX IF NOT EXISTS tags_category_idx ON tags (category);
CREATE INDEX IF NOT EXISTS trade_tags_trade_id_idx ON trade_tags (trade_id);
CREATE INDEX IF NOT EXISTS trade_tags_tag_id_idx ON trade_tags (tag_id);
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own trades" ON trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own trade tags" ON trade_tags
  FOR ALL USING (
    trade_id IN (
      SELECT id FROM trades WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

After running this SQL, verify:
1. Tables are created in Table Editor
2. RLS is enabled for all tables
3. Indexes are created

Enable Auth if you haven't:
- Go to Authentication → Providers
- Enable Email provider
- (Optional) Enable Google OAuth with your credentials
