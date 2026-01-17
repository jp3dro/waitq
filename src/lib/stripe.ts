import Stripe from "stripe";

/**
 * Determines if we're in production (live Stripe mode) or development/test mode.
 * Uses VERCEL_ENV for Vercel deployments, falls back to NODE_ENV.
 */
export function isProduction(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) {
    return vercelEnv === "production";
  }
  return process.env.NODE_ENV === "production";
}

/**
 * Returns the appropriate Stripe secret key based on environment.
 * In production (live): uses STRIPE_SECRET_KEY_LIVE
 * In development/test: uses STRIPE_SECRET_KEY (test key)
 */
export function getStripe() {
  const isProd = isProduction();
  const key = isProd 
    ? process.env.STRIPE_SECRET_KEY_LIVE 
    : process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    throw new Error(
      isProd 
        ? "STRIPE_SECRET_KEY_LIVE missing (required for production)" 
        : "STRIPE_SECRET_KEY missing (required for development)"
    );
  }
  
  return new Stripe(key);
}


