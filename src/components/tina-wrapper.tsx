"use client";

import { useTina } from "tinacms/dist/react";
import type { HomeQuery, PricingQuery, RestaurantPageQuery, FeatureQuery, TermsQuery } from "../../tina/__generated__/types";

// Generic TinaCMS wrapper for visual editing
export function useTinaData<T extends object>(props: {
  query: string;
  variables: object;
  data: T;
}): { data: T } {
  const { data } = useTina(props);
  return { data: data as T };
}

// Type-safe wrappers for each collection
export function useHomeData(props: {
  query: string;
  variables: Record<string, unknown>;
  data: HomeQuery;
}) {
  return useTina(props);
}

export function usePricingData(props: {
  query: string;
  variables: Record<string, unknown>;
  data: PricingQuery;
}) {
  return useTina(props);
}

export function useRestaurantPageData(props: {
  query: string;
  variables: Record<string, unknown>;
  data: RestaurantPageQuery;
}) {
  return useTina(props);
}

export function useFeatureData(props: {
  query: string;
  variables: Record<string, unknown>;
  data: FeatureQuery;
}) {
  return useTina(props);
}

export function useTermsData(props: {
  query: string;
  variables: Record<string, unknown>;
  data: TermsQuery;
}) {
  return useTina(props);
}
