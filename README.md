# FX Macro Monitor & Funded Account Auditor

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

An institutional-grade quantitative macroeconomic terminal, multi-account funded trader audit suite, and live financial news intelligence dashboard. Engineered for forex traders, prop firm participants (FTMO, FundedNext, Alpha Capital, etc.), and macro analysts requiring real-time economic data, strict risk-limit enforcement, and automated compliance tracking.

---

## 🌟 Key Features

### 1. Institutional Economic Calendar (Forex Factory Wire)
- **Live Upstream Synchronization**: Automated background polling against official Forex Factory releases every 30–45 seconds.
- **Dynamic Trading Week Anchoring**: Event dates automatically anchor to the live trading week relative to today (`new Date()`), preventing stale or hardcoded historical dates.
- **Divergence & Surprise Metrics**: Tracks consensus forecasts against actual releases, calculating directional delta surprises (Beat `▲`, Miss `▼`, In-Line `=`).
- **G8 + Emerging Powers Coverage**: Curated high-impact calendar covering USD, EUR, GBP, JPY, AUD, CAD, CHF, NZD, plus China (CNY) Caixin PMIs/trade releases and major Global Summits (IMF, World Bank, OPEC+ JMMC, G7).
- **Geographic Timezone Converter**: Automatic local timezone detection via browser `Intl` API, with one-click toggles for New York Time (EDT) and UTC, complete with midnight day-shift detection.

### 2. Prop Firm High-Impact News Window Sentinel
- **2-Minute Execution Guard**: Automated alerts marking releases where funded accounts are restricted from opening/closing orders 2 minutes before and 2 minutes after high-impact (Red Folder) announcements.
- **Visual Countdown Clock**: Real-time ticker counting down to next scheduled Tier-1 release.

### 3. Live Global Financial News Wire
- **Aggregated RSS Financial Wires**: Live news pipeline aggregating headline stories from CNBC Markets, CNBC Global Economy, and MarketWatch.
- **AI-Powered Search Grounding**: Fallback pipeline with Google Gemini Search Grounding retrieving real-time breaking market catalysts and central bank policy statements.
- **Institutional Tagging**: Automatic categorization into Central Banks, Forex Majors, Commodities & Metals, and Prop Desk Policies with affected currency pairs (`EUR/USD`, `USD/JPY`, `XAU/USD`).
- **Detailed Article Inspector**: Modal inspection showing executive summaries, quantitative market impacts, and key trade takeaways.

### 4. Central Bank Matrix & Real Rate Divergence
- **Benchmark Policy Rates**: Live tracking of key rate targets across Federal Reserve, ECB, BoE, BoJ, RBA, BoC, SNB, and RBNZ.
- **Real Yield Differentials**: Dynamic spread calculation ($Rate - Inflation$) identifying macro carry trade sentiment and capital flow directions.
- **Hawkish/Dovish Stance Barometer**: Quantitative sentiment indicators derived from recent governor speeches and meeting minutes.

### 5. Multi-Account Funded Trader Auditor
- **Drawdown Limit Monitoring**: Strict compliance tracking for maximum 5% daily drawdown and 10% total trailing drawdown rules.
- **Trailing High-Water Mark**: Real-time equity peak tracking with visual safety margin cushions.
- **Multi-Account Switching**: Manage multiple prop accounts and challenge stages (Phase 1, Phase 2, Funded).

---

## 🏗️ System Architecture & Implementation

### Full-Stack Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Client                        │
│             React 19 SPA + Tailwind CSS v4                  │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ ForexFactoryCalendar  │       │     LiveNewsWire      │  │
│  │ (30-45s auto polling) │       │ (45s auto polling)    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│  ┌───────────┴───────────────────────────────┴───────────┐  │
│  │      Central Bank Matrix & Funded Account Auditor     │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP Fetch (/api/*)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js Backend Server                │
│                 (server.ts running on port 3000)             │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ /api/calendar/*  │  │   /api/news/*    │  │/api/macro │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘  │
│           │                     │                  │        │
│  ┌────────▼─────────────────────▼──────────────────▼─────┐  │
│  │     In-Memory TTL Caching Engine (30s - 45s TTL)      │  │
│  └────────┬─────────────────────┬──────────────────┬─────┘  │
└───────────┼─────────────────────┼──────────────────┼────────┘
            │                     │                  │
    ┌───────▼────────┐    ┌───────▼────────┐  ┌──────▼──────┐
    │  Forex Factory │    │ CNBC & Dow     │  │ Google      │
    │  Live JSON API │    │ Jones RSS      │  │ Gemini 3.5  │
    └────────────────┘    └────────────────┘  │ Flash API   │
                                              └─────────────┘
```

### Key Implementation Details

1. **Dual Dev/Production Runtime (`server.ts`)**:
   - In development mode, Express dynamically attaches Vite's middleware (`createViteServer({ server: { middlewareMode: true } })`), allowing instant hot reload and API handling on a unified single port (3000).
   - In production mode, Express serves pre-built static assets from `/dist` while hosting all `/api/*` microservices.

2. **Resilient Data Ingestion Pipeline**:
   - **Calendar Feed**: Directly queries official upstream feeds with fallback to dynamic week-calculating engines (`generateDynamicCalendarEvents`) that compute relative Monday–Friday trading dates so dates are never frozen.
   - **Intraday Release Logic**: Evaluates whether scheduled times have passed (`now >= new Date(isoDate)`). Morning releases populate actuals immediately; afternoon releases remain cleanly flagged as `PENDING`.
   - **News Feed**: Concurrently fetches multiple syndicated RSS channels, normalizes XML CDATA feeds, tags market categories, and falls back to Gemini Search Grounding if network issues arise.

3. **In-Memory Stale-While-Revalidate Caching**:
   - Protects upstream endpoints from rate limiting while giving clients instant millisecond responses.
   - Supports explicit cache-busting via `?force=true` query parameters when traders click "Sync Live Feed".

---

## 📁 Repository Structure

```text
.
├── server.ts                   # Express server, proxy routes, live feeds & Gemini grounding
├── index.html                  # HTML entry point with meta tags & fonts
├── vite.config.ts              # Vite configuration with React & Tailwind plugins
├── package.json                # Project dependencies and script definitions
├── tsconfig.json               # TypeScript strict configuration
├── .gitignore                  # Git exclusions (node_modules, dist, .env)
├── .env.example                # Template for environment configuration
└── src/
    ├── main.tsx                # React application bootstrap
    ├── App.tsx                 # Main application dashboard layout & global timers
    ├── index.css               # Global Tailwind CSS imports & theme overrides
    ├── types/
    │   └── index.ts            # TypeScript interfaces (Calendar events, News, Accounts)
    ├── data/
    │   └── forexFactoryData.ts # Calendar generators, week computing algorithms & fallback data
    └── components/
        ├── Header.tsx          # Terminal header, market status, global sync trigger
        ├── news/
        │   ├── ForexFactoryCalendar.tsx  # Interactive Economic Calendar table & card views
        │   └── LiveNewsWire.tsx          # Real-time financial news wire feed & modal reader
        ├── macro/              # Central bank interest rates & real yield matrices
        ├── accounts/           # Funded trader account switcher & risk analytics
        ├── analytics/          # Equity charts & drawdown analytics (Recharts)
        └── modals/             # Event specification & manual override modals
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **bun** / **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/iddrisumohamme1/Macroeconomices.git
cd Macroeconomices
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
Optionally provide your Google Gemini API Key in `.env` for AI-grounded search:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Run in Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with live API routes and Vite hot-module replacement.

### 5. Build for Production
```bash
# Type check and build frontend assets
npm run build

# Start the full-stack server
npm run start
```

---

## 📡 API Reference

| Endpoint | Method | Description | Cache Duration |
| :--- | :---: | :--- | :---: |
| `/api/calendar/sync` | `GET` | Live economic calendar with surprise metrics & actuals | 30 seconds |
| `/api/news/wire` | `GET` | Real-time global macro news articles & currency tags | 45 seconds |
| `/api/news/feed` | `GET` | Syndicated CNBC & MarketWatch market news wire | 45 seconds |
| `/api/macro/search-rates` | `GET` | Central bank interest rates & inflation figures | 10 minutes |

*Append `?force=true` to any GET request to bypass the cache and fetch fresh data.*

---

## 🛡️ License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
