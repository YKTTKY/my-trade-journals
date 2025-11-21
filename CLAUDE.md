# CLAUDE.md: Persistent Memory for Development Sessions

## Current Project Context: Trading Journal App
- Stack: React.js (frontend with hooks, Context API, Router), Supabase (backend: auth, PostgreSQL, real-time, storage).
- UI Style: Modern dark-mode minimalism (Tailwind CSS; dark grays/blacks, green/red accents for P&L, bento grids for dashboards, subtle animations via Recharts).
- Features: Trade logging (entry/exit, P&L auto-calc), tagging (multi-select chips with emojis), analytics (50+ metrics: win rate, ROI; charts/heatmaps), calendar views (react-calendar, profitability gradients), templates (JSONB storage, form builder).
- Setup: Use Vite/Create React App; env vars (SUPABASE_URL, SUPABASE_ANON_KEY); RLS for data privacy; libraries (react-hot-toast, PapaParse/jsPDF for exports, Jest for tests).
- Deployment: Vercel/Netlify for frontend; Supabase hosting.

## Coding Style Preferences
- Clean, modular code: Use functional components in React; avoid class components.
- Best Practices: Hooks for state/logic; context for global state; validation (required/numeric fields); pagination/indexing for performance.
- Error Handling: Toast notifications; check for null/undefined (e.g., optional chaining).
- Testing: Basic unit tests (Jest/React Testing Library) for key components.
- Version Control: Git with meaningful commits; check status/diff/log before changes.

## Language Preferences
- Primary: JavaScript/TypeScript (frontend).
- Secondary: SQL (for Supabase queries and functions).

## Tone and Communication
- Professional, detailed explanations: Step-by-step guides, roadmaps (phased: setup/core/enhance/test), debugging tips.
- Avoid verbosity: Focus on actionable fixes.
- Interactive: Suggest iterations, confirmations; provide code blocks per file.

## Technical Constraints
- Data: Use GROUP BY for aggregations; real-time subscriptions for syncing.

## Commonly Used File Formats
- Code: .js/.tsx (React).
- Data: JSONB (flexible fields in Supabase), CSV/PDF (exports).
- Docs: Markdown (README.md, CLAUDE.md); include setup instructions, env vars.

## Workflow Practices
- Phased Development: Setup → Core Features → UI/Enhancements → Testing/Deployment.
- Debugging: Verify inputs (e.g., auth tokens); use console logs; split tasks.
- Iteration: Start with prototypes; refine based on errors.
- Tools: TrendSpider/TradingView for trading refs.

Last Updated: November 17, 2025
