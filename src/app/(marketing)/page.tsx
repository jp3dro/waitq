import { getHomePageData } from "@/lib/tina";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const { data, query, variables } = await getHomePageData();

  return (
    <HomeClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
