# Karo UK Price Intelligence

Live price monitoring dashboard for E45 products vs competitors on Boots UK (boots.com).

## What it does

Pulls live price data from Supabase (populated daily by the [pricescan-uk](https://github.com/EirikWikHeltne/pricescan-uk) scraper) and displays it in an interactive dashboard.

### Views

- **Overview** — KPI cards, category-level insights, bar chart comparing E45 vs competitor averages, and product-level price bars
- **Compare** — Side-by-side E45 vs competitor pricing within each category
- **Detail** — Full product table with brand, category, price, and stock status

### Products tracked

8 E45 products and 15 competitors across 4 categories:

| Category | E45 | Competitors |
|---|---|---|
| Emollient | Cream 350g, Cream 125g | CeraVe, Nivea Soft, Oilatum |
| Body Lotion | Daily Lotion 400ml, Lotion 500ml, Lotion 200ml | Nivea, Vaseline, CeraVe, Aveeno |
| Face Care | Daily Protect SPF30 50ml | Simple, Aveeno |
| Treatment | Itch Relief 100g, Itch Relief 50g | Eurax, QV |

## Tech stack

- **Next.js 14** — React framework
- **Recharts** — Charts and data visualisation
- **Supabase** — PostgreSQL database (read-only via anon key)
- **Vercel** — Hosting and deployment

## Data pipeline

```
Boots WCS REST API → GitHub Actions (daily at 03:00 UTC) → Supabase → This dashboard
```

The scraper runs in the `pricescan-uk` repo using GitHub Actions. It hits the Boots IBM WebSphere Commerce API directly (no browser/Playwright needed), extracts prices, and inserts them into Supabase.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deployment

Connected to Vercel via GitHub integration. Every push to `main` triggers a new deployment automatically.

## Brand identity

Uses Karo Healthcare brand colours and Euclid Circular A typeface:

| Token | Hex | Usage |
|---|---|---|
| Primary | `#110B36` | Header, E45 elements, tooltips |
| Secondary | `#FAD7C2` | Competitor bars, highlights, accents |
| Text | `#1a1a2e` | Body copy |
| Muted | `#6B7280` | Labels, captions |
