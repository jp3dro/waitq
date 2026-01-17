# Environment Variables Setup

## Overview

WaitQ uses different Stripe API keys based on the environment:
- **Development/Test**: Uses `STRIPE_SECRET_KEY` (sk_test_...)
- **Production/Live**: Uses `STRIPE_SECRET_KEY_LIVE` (sk_live_...)

The system automatically detects the environment using `VERCEL_ENV` (on Vercel) or `NODE_ENV`.

## Required Environment Variables

### Local Development (.env.local)

```bash
# Environment
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (Test Mode for Development)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key

# Email
RESEND_API_KEY=your_resend_api_key

# Admin
ADMIN_EMAIL=your_admin_email@example.com
```

### Production Environment (Vercel/Deployment)

In addition to the above, add:

```bash
# Stripe (Live Mode for Production)
STRIPE_SECRET_KEY_LIVE=sk_live_your_live_secret_key
```

## Stripe Product IDs

Update `src/lib/plans.ts` with your Stripe product IDs:

```typescript
stripe: {
  productIdTest: "prod_TestXXXXXXXXXX",  // From Stripe Test Mode
  productIdLive: "prod_LiveXXXXXXXXXX",  // From Stripe Live Mode
  productLookupKey: "waitq_base",
  priceLookupKeyMonthly: "BASE",
}
```

## How It Works

1. **Local Development** (`localhost`):
   - Uses `STRIPE_SECRET_KEY` (test mode)
   - Uses `productIdTest` from plans
   - All Stripe operations use test data

2. **Production** (`VERCEL_ENV=production`):
   - Uses `STRIPE_SECRET_KEY_LIVE` (live mode)
   - Uses `productIdLive` from plans
   - All Stripe operations use real payments

## Migration Checklist

When going live:

1. ✅ Create products and prices in Stripe Live Mode
2. ✅ Update `productIdLive` in `src/lib/plans.ts`
3. ✅ Set `STRIPE_SECRET_KEY_LIVE` in production environment
4. ✅ Test checkout flow in production
5. ✅ Verify webhook endpoints are configured for live mode
