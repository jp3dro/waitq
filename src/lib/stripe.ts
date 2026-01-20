import Stripe from "stripe";

/**
 * Returns Stripe client using STRIPE_SECRET_KEY.
 * The key automatically switches between test/live based on your environment config.
 */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(key);
}


