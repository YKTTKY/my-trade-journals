# Trading Journal Pro 🎯

A comprehensive, production-ready trading journal application for tracking, analyzing, and improving your trading performance.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.5-38bdf8)

## ✨ Features

### 📝 Trade Logging
- Log detailed trades with entry/exit prices, position size, stop-loss, take-profit, and fees
- Auto-calculated profit/loss (P&L) and P&L percentage
- Support for multiple asset types (stocks, forex, crypto, options, futures, commodities)
- Rich text notes for each trade

### 🏷️ Tagging System
- Multi-select tagging with emoji support
- Categories: Assets, Strategies, Market Conditions, Emotional States
- Filter and analyze trades by tags
- Visual tag chips with color coding

### 📈 Performance Analytics
- **50+ Trading Metrics** including:
  - Win rate, Profit Factor, Risk/Reward ratios
  - Expectancy, Max Drawdown, Sharpe Ratio
  - Average win/loss, Best/Worst trades
  - Consecutive wins/losses streaks
- Interactive charts (Recharts):
  - Equity curve with area chart
  - Win/Loss distribution with pie chart
  - Performance by asset, strategy, and time period
  - Risk analysis metrics

### 📅 Calendar View
- Heatmap calendar showing profitable/losing days
- Monthly and weekly profit summaries
- Day-of-week analysis (best trading days)
- Click to view trades for any date

### 📝 Custom Templates
- Create trading plan templates
- Pre-trade checklists
- Session recap templates
- Risk management rules
- Form builder with save/load functionality

### 📊 Export & Reports
- Export trades to CSV format
- Generate PDF reports with charts
- JSON export for advanced analysis
- Filtered data export

### 🔐 Authentication & Security
- Email/password authentication
- Google OAuth support (configurable)
- Row Level Security (RLS) policies
- Protected routes
- Session management

### 🎨 Modern UI
- Dark mode minimalism design
- Tailwind CSS with custom components
- Responsive design (mobile & desktop)
- Smooth animations and transitions
- Bento-grid dashboard layout

## 🚀 Tech Stack

- **Frontend**: React 18 (Hooks, Context API, Router)
- **Styling**: Tailwind CSS 3.3
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Recharts
- **Export**: PapaParse (CSV), jsPDF (PDF)
- **Calendar**: react-calendar
- **Notifications**: react-hot-toast

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account (free tier works!)
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/trading-journal.git
cd trading-journal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

5. **Set up database schema**

Go to your Supabase project SQL Editor and run:

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

6. **Enable Authentication** (if using Google OAuth):
   - Go to Authentication → Providers
   - Enable Email provider
   - (Optional) Enable Google OAuth and add your credentials

7. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🛠 Configuration

### Customizing Tailwind

Edit `tailwind.config.js` to customize:
- Colors
- Fonts
- Spacing
- Components

### Supabase Configuration

All Supabase operations are in `src/services/supabase.js`. Modify as needed for:
- Custom queries
- Real-time subscriptions
- Storage operations

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Yes |
| `VITE_SUPABASE_SERVICE_KEY` | Service role key (backend only) | Optional |

## 🎨 Customization

### Adding New Features

1. **Database**: Add new tables/columns in Supabase
2. **API**: Add functions in `src/services/supabase.js`
3. **Components**: Create new components in `src/components/`
4. **Pages**: Add new pages in `src/pages/`
5. **Routing**: Update routes in `src/App.jsx`

### UI Customization

- Colors: Edit `tailwind.config.js` in the `theme.extend.colors` section
- Components: Modify existing components in `src/components/`
- Layout: Adjust `src/components/Layout.jsx` for navigation changes

## 📱 Mobile Optimization

The app is fully responsive with:
- Collapsible sidebar on mobile
- Touch-friendly buttons
- Responsive tables and charts
- Optimized forms for mobile input

## 📊 Performance Tips

1. **Indexing**: Ensure all queries use appropriate indexes
2. **Pagination**: For large datasets, implement pagination
3. **Caching**: Use React Query or SWR for data caching
4. **Code Splitting**: Already configured with Vite

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

Add tests in `src/__tests__/` directory.

## 🚀 Deployment

### Deploy Frontend

#### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

#### Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables
5. Deploy!

### Supabase Hosting

The database is already hosted by Supabase. No additional deployment needed!

## 🔒 Security

- All data protected by Row Level Security (RLS)
- Users can only access their own data
- Environment variables never exposed to client (except ANON key)
- Passwords hashed by Supabase Auth

## 📈 Analytics Integration

Add your analytics tracking (e.g., Google Analytics, Plausible) in:
- `src/main.jsx` for initialization
- Track page views in `src/App.jsx`

## 🐛 Troubleshooting

### Database Issues

**Problem**: "permission denied for table trades"

**Solution**: Ensure RLS policies are enabled and correctly configured. Run the SQL setup script again.

### Environment Variables

**Problem**: "Missing Supabase environment variables"

**Solution**: Double-check your `.env` file is in the root directory and contains both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### CORS Issues

**Problem**: API requests failing with CORS errors

**Solution**: Ensure your frontend URL is added to Supabase CORS settings in Authentication → URL Configuration.

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by professional trading platforms
- Designed for serious traders

---

**Happy Trading!** 📈

Built with ❤️ using React, Supabase, and Tailwind CSS
