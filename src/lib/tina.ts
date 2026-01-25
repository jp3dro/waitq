import client from "../../tina/__generated__/client";

export { client };

// Helper to get home page data
export async function getHomePageData() {
  const result = await client.queries.home({ relativePath: "home.json" });
  return result;
}

// Helper to get pricing page data
export async function getPricingPageData() {
  const result = await client.queries.pricing({ relativePath: "pricing.json" });
  return result;
}

// Helper to get restaurant page data
export async function getRestaurantPageData() {
  const result = await client.queries.restaurantPage({ relativePath: "restaurant-waitlist-app.json" });
  return result;
}

// Helper to get feature page data by slug
export async function getFeaturePageData(slug: string) {
  const result = await client.queries.feature({ relativePath: `${slug}.json` });
  return result;
}

// Helper to get terms page data
export async function getTermsPageData() {
  const result = await client.queries.terms({ relativePath: "terms.mdx" });
  return result;
}

// Helper to get global settings
export async function getGlobalSettings() {
  const result = await client.queries.global({ relativePath: "global.json" });
  return result;
}
