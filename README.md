WaitQ is a waiting list manager for restaurants and local businesses. It has public marketing pages and a protected dashboard accessible via Google login. Customers receive SMS with a link to track their place in the queue.

## Getting Started

1) Copy envs

```bash
cp env.template .env.local
# Fill in Supabase, Stripe, and Twilio credentials
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

### Twilio (SMS + WhatsApp)
- Get `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and create a Messaging Service; set `TWILIO_MESSAGING_SERVICE_SID`.
- For WhatsApp via Twilio:
  - In Twilio Console, enable WhatsApp sandbox for testing or request production access.
  - Set `TWILIO_WHATSAPP_FROM` to your WA-enabled number in the format `whatsapp:+14155238886` (use your own number once approved).
  - In Sandbox, join the sandbox by sending the join code from the console to the sandbox number from your test phone.
  - In production, ensure your WhatsApp templates are approved before sending business-initiated messages.
  - Notes:
    - We send using the API directly; no Messaging Service SID is required for WhatsApp.
    - We will attempt SMS and/or WhatsApp depending on the checkboxes in the Add form.

## Routes
- Public: `/`, `/pricing`, `/login`, `/w/[token]` (customer status)
- Private: `/dashboard` (requires Google login)
- APIs: `POST /api/waitlist`, `POST /api/stripe/checkout`, `POST /api/stripe/webhook`
