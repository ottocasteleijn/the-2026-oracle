# The 2026 Oracle 🔮

A high-end social prediction market for friends. Make bold predictions about 2026, get scored by an AI Judge, and compete for bragging rights.

## Features

- **AI Judge Engine**: Real-time AI evaluation of predictions using Claude, Gemini, or GPT-4o
- **Streaming Analysis**: Live HUD-style feedback as you type your prediction
- **Groups/Circles**: Private prediction circles for you and your friends
- **Voting System**: Friends can vote "Agreed" or "Doubt" on predictions
- **Leaderboard**: Track potential winnings across all prophets
- **Beautiful UI**: Dark "Deep Future" theme with glassmorphism and neon accents

## Tech Stack

- **Framework**: Next.js 15 (App Router + Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Database & Auth**: Supabase (Postgres + Row Level Security)
- **Styling**: Tailwind CSS v4 + Custom Theme
- **Animation**: Framer Motion
- **AI**: Vercel AI SDK (Multi-provider: Anthropic, Google, OpenAI)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A Supabase project
- API key(s) for at least one AI provider (Anthropic, Google, or OpenAI)

### Installation

1. Clone and install dependencies:
   ```bash
   cd the-2026-oracle
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # AI Providers (add the ones you want to use)
   ANTHROPIC_API_KEY=your-anthropic-api-key
   GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
   OPENAI_API_KEY=your-openai-api-key

   # Default AI Provider (anthropic | google | openai)
   AI_PROVIDER=anthropic
   ```

3. Set up the database:
   - Go to your Supabase project's SQL Editor
   - Run the contents of `supabase/schema.sql`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
the-2026-oracle/
├── app/
│   ├── (auth)/           # Login/signup pages
│   ├── (dashboard)/      # Main app pages
│   ├── api/              # API routes
│   │   ├── judge/        # AI evaluation endpoints
│   │   ├── predictions/  # Prediction CRUD
│   │   ├── groups/       # Group management
│   │   └── votes/        # Voting system
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Base UI components
│   ├── prediction-input.tsx   # AI-powered input with HUD
│   ├── prediction-card.tsx    # Prediction display cards
│   ├── score-gauge.tsx        # Animated score displays
│   └── leaderboard-table.tsx  # Ranking tables
├── lib/
│   ├── supabase/         # Database clients
│   └── ai/               # AI provider config
├── supabase/
│   └── schema.sql        # Database schema
└── types/
    └── database.ts       # TypeScript types
```

## AI Judge Scoring

The AI Judge evaluates predictions on two dimensions:

### Concreteness (0-10)
How specific and measurable the prediction is:
- **0-3**: Vague (uses "maybe", "probably", "might")
- **4-6**: Moderate specificity
- **7-10**: Very concrete (specific dates, numbers, names)

### Boldness (0-10)
How unlikely/bold the prediction is:
- **0-3**: Safe, obvious predictions
- **4-6**: Reasonable 50/50 chances
- **7-10**: Bold, contrarian, surprising

### Payout Odds Formula
```
payout_odds = (boldness × 0.8) + (concreteness × 0.5)
```

A prediction must have a concreteness score of **at least 4** to be submitted.

## Database Schema

- **profiles**: User profiles linked to Supabase Auth
- **groups**: Private prediction circles
- **group_members**: Many-to-many with roles (admin/member)
- **predictions**: Predictions with AI scores
- **votes**: Agreed/Doubt voting
- **settlements**: Resolution tracking for 2026

See `supabase/schema.sql` for the complete schema with RLS policies.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own prediction markets!

---

Built with 🔮 for the prophets of 2026

