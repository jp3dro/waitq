WaitQ is a waiting list manager for restaurants and local businesses. It has public marketing pages and a protected dashboard accessible via Google login. Customers receive SMS with a link to track their place in the queue.

## Getting Started

1) Copy envs

```bash
cp env.template .env.local
# Fill in Supabase, Stripe, and BulkGate credentials
```

2) Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setup

### Supabase
- Create project → get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- In SQL editor, run `supabase-schema.sql`.
- Enable Google provider: add Client ID/Secret in Auth → Providers.

### Stripe
- Create a product/price and set `NEXT_PUBLIC_STRIPE_PRICE_ID`.
- Get `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.
- Add webhook: `http://localhost:3000/api/stripe/webhook` and save `STRIPE_WEBHOOK_SECRET`.

### BulkGate (SMS + WhatsApp)
- In Portal → Modules & APIs, create an API and note `BULKGATE_APPLICATION_ID` and `BULKGATE_APPLICATION_TOKEN`.
- Set these in `.env.local`.
- WhatsApp: ensure your sender and any required templates are approved in BulkGate; messages are sent when "WhatsApp" is checked in the Add form.

## Routes
- Public: `/`, `/pricing`, `/login`, `/w/[token]` (customer status)
- Private: `/dashboard` (requires Google login)
- APIs: `POST /api/waitlist`, `POST /api/stripe/checkout`, `POST /api/stripe/webhook`
