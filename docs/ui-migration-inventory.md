# UI Migration Inventory (WaitQ)

This document is the **source-of-truth checklist** for the shadcn Vega migration: routes to update, API endpoints to preserve, and the models (Supabase tables) that must continue to behave the same.

Generated from a repo scan on 2025-12-29.

## App routes (pages)

Notes:
- Route groups like `(marketing)` / `(private)` / `(public)` **do not appear in the URL**, but do define layout boundaries.
- `/` is implemented as a wrapper page (`src/app/page.tsx`) that renders the marketing home (`src/app/(marketing)/page.tsx`).

| Route | UI area | File |
| --- | --- | --- |
| `/` | Wrapper (Nav + Marketing home) | `src/app/page.tsx` |
| `/` | Marketing home content | `src/app/(marketing)/page.tsx` |
| `/contact` | Marketing | `src/app/(marketing)/contact/page.tsx` |
| `/pricing` | Marketing | `src/app/(marketing)/pricing/page.tsx` |
| `/terms` | Marketing | `src/app/(marketing)/terms/page.tsx` |
| `/use-cases/barber-shop` | Marketing | `src/app/(marketing)/use-cases/barber-shop/page.tsx` |
| `/use-cases/beauty-salons` | Marketing | `src/app/(marketing)/use-cases/beauty-salons/page.tsx` |
| `/use-cases/clinics-and-medical` | Marketing | `src/app/(marketing)/use-cases/clinics-and-medical/page.tsx` |
| `/use-cases/hotels-and-accommodations` | Marketing | `src/app/(marketing)/use-cases/hotels-and-accommodations/page.tsx` |
| `/use-cases/massages` | Marketing | `src/app/(marketing)/use-cases/massages/page.tsx` |
| `/use-cases/public-services` | Marketing | `src/app/(marketing)/use-cases/public-services/page.tsx` |
| `/use-cases/restaurants` | Marketing | `src/app/(marketing)/use-cases/restaurants/page.tsx` |
| `/use-cases/warehouse-and-transport` | Marketing | `src/app/(marketing)/use-cases/warehouse-and-transport/page.tsx` |
| `/login` | Public (auth) | `src/app/(public)/login/page.tsx` |
| `/invite/[token]` | Public (invite) | `src/app/(public)/invite/[token]/page.tsx` |
| `/invite/[token]/reject` | Public (invite) | `src/app/(public)/invite/[token]/reject/page.tsx` |
| `/dashboard` | Private | `src/app/(private)/dashboard/page.tsx` |
| `/lists` | Private | `src/app/(private)/lists/page.tsx` |
| `/lists/[id]` | Private | `src/app/(private)/lists/[id]/page.tsx` |
| `/customers` | Private | `src/app/(private)/customers/page.tsx` |
| `/analytics` | Private | `src/app/(private)/analytics/page.tsx` |
| `/locations` | Private | `src/app/(private)/locations/page.tsx` |
| `/users` | Private | `src/app/(private)/users/page.tsx` |
| `/subscriptions` | Private | `src/app/(private)/subscriptions/page.tsx` |
| `/settings` | Private | `src/app/(private)/settings/page.tsx` |
| `/businesses` | Private | `src/app/(private)/businesses/page.tsx` |
| `/customization` | Private | `src/app/(private)/customization/page.tsx` |
| `/display/[token]` | Display (public screen) | `src/app/display/[token]/page.tsx` |
| `/w/[token]` | Status (public) | `src/app/w/[token]/page.tsx` |

## Layout boundaries

| Layout scope | File |
| --- | --- |
| Root (theme/font/Toaster) | `src/app/layout.tsx` |
| Marketing routes | `src/app/(marketing)/layout.tsx` |
| Public routes | `src/app/(public)/layout.tsx` |
| Private (auth-gated) routes | `src/app/(private)/layout.tsx` |

## API endpoints (Next route handlers)

| Endpoint | Methods | File |
| --- | --- | --- |
| `/api/bulkgate/webhook` | `GET`, `POST` | `src/app/api/bulkgate/webhook/route.ts` |
| `/api/check-bulkgate` | `GET` | `src/app/api/check-bulkgate/route.ts` |
| `/api/customers` | `PATCH`, `DELETE` | `src/app/api/customers/route.ts` |
| `/api/customization` | `GET`, `PATCH` | `src/app/api/customization/route.ts` |
| `/api/customization/logo` | `POST`, `DELETE` | `src/app/api/customization/logo/route.ts` |
| `/api/display` | `GET` | `src/app/api/display/route.ts` |
| `/api/display/checkin` | `POST` | `src/app/api/display/checkin/route.ts` |
| `/api/invite/accept` | `POST` | `src/app/api/invite/accept/route.ts` |
| `/api/locations` | `GET`, `POST`, `PATCH`, `DELETE` | `src/app/api/locations/route.ts` |
| `/api/memberships` | `POST`, `PUT`, `DELETE` | `src/app/api/memberships/route.ts` |
| `/api/memberships_list` | `GET` | `src/app/api/memberships_list/route.ts` |
| `/api/migrate` | `POST` | `src/app/api/migrate/route.ts` |
| `/api/notification-stats` | `GET` | `src/app/api/notification-stats/route.ts` |
| `/api/profile` | `GET`, `PATCH` | `src/app/api/profile/route.ts` |
| `/api/profile/upload` | `POST`, `DELETE` | `src/app/api/profile/upload/route.ts` |
| `/api/stripe/archive-products` | `POST` | `src/app/api/stripe/archive-products/route.ts` |
| `/api/stripe/checkout` | `POST` | `src/app/api/stripe/checkout/route.ts` |
| `/api/stripe/seed` | `POST` | `src/app/api/stripe/seed/route.ts` |
| `/api/stripe/webhook` | `GET`, `POST` | `src/app/api/stripe/webhook/route.ts` |
| `/api/w-status` | `GET` | `src/app/api/w-status/route.ts` |
| `/api/waitlist` | `POST`, `PATCH`, `PUT`, `DELETE` | `src/app/api/waitlist/route.ts` |
| `/api/waitlist-list` | `GET` | `src/app/api/waitlist-list/route.ts` |
| `/api/waitlist-now-serving` | `GET` | `src/app/api/waitlist-now-serving/route.ts` |
| `/api/waitlists` | `GET`, `POST`, `PATCH`, `PUT`, `DELETE` | `src/app/api/waitlists/route.ts` |

## Client call sites for `/api/*`

These are the primary UI files that must remain functional after the redesign (forms, tables, buttons, dialogs).

- **/api/invite/accept**: `src/app/(public)/login/page.tsx`, `src/app/(public)/invite/[token]/invite-client.tsx`
- **/api/memberships_list**: `src/app/(private)/users/users_client.tsx`
- **/api/memberships**: `src/app/(private)/users/users_client.tsx`
- **/api/customization**: `src/app/(private)/customization/CustomizationClient.tsx`
- **/api/customization/logo**: `src/app/(private)/customization/CustomizationClient.tsx`
- **/api/profile/upload**: `src/app/(private)/customization/CustomizationClient.tsx`
- **/api/customers**: `src/app/(private)/customers/table.tsx`
- **/api/waitlists**: `src/app/(private)/lists/create-list-button.tsx`, `src/app/(private)/lists/[id]/edit-list-button.tsx`, `src/app/(private)/lists/[id]/clear-waitlist-button.tsx`, `src/app/(private)/dashboard/waitlist-add-form.tsx`, `src/app/(private)/dashboard/waitlist-table.tsx`
- **/api/waitlist-list**: `src/app/(private)/dashboard/waitlist-table.tsx`
- **/api/waitlist**: `src/app/(private)/dashboard/waitlist-add-form.tsx`, `src/app/(private)/dashboard/waitlist-table.tsx`
- **/api/w-status**: `src/app/w/[token]/status-client.tsx`

## Supabase tables referenced (“models”)

The redesign must not change behavior around these tables.

| Table | Approx usage count | Key files |
| --- | ---:| --- |
| `waitlist_entries` | 61 | `src/app/(private)/dashboard/page.tsx`, `src/app/(private)/analytics/page.tsx`, `src/app/api/waitlist/route.ts` |
| `businesses` | 50 | `src/components/private-sidebar.tsx`, `src/app/(private)/dashboard/page.tsx`, `src/app/api/memberships/route.ts` |
| `memberships` | 34 | `src/app/api/memberships/route.ts`, `src/app/(public)/invite/[token]/page.tsx` |
| `subscriptions` | 14 | `src/app/(private)/subscriptions/page.tsx`, `src/app/api/stripe/webhook/route.ts` |
| `waitlists` | 13 | `src/app/(private)/lists/page.tsx`, `src/app/api/waitlists/route.ts` |
| `business_locations` | 8 | `src/app/(private)/dashboard/page.tsx`, `src/app/api/locations/route.ts` |
| `notification_logs` | 8 | `src/app/api/notification-stats/route.ts`, `src/app/api/waitlist/route.ts` |
| `covers` | 4 | `src/app/api/profile/upload/route.ts` |
| `logos` | 2 | `src/app/api/customization/logo/route.ts` |

## Integrations (where to regression-test)

- **Stripe**: `src/lib/stripe.ts`, `src/app/api/stripe/*`, `src/app/(private)/subscriptions/page.tsx`, `src/app/auth/callback/route.ts`
- **Supabase**: `src/lib/supabase/{client,server,admin}.ts`, most private pages + API routes
- **BulkGate**: `src/lib/bulkgate.ts`, `src/app/api/bulkgate/webhook/route.ts`, `src/app/api/check-bulkgate/route.ts`
- **Twilio**: `src/lib/twilio.ts`
- **Resend**: `src/lib/resend.ts`, `src/app/api/memberships/route.ts`, `src/app/api/waitlist/route.ts`

