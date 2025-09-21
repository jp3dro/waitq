import Nav from "@/components/nav";
import MarketingHome from "./(marketing)/page";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <div className="flex-1">
        <MarketingHome />
      </div>
    </div>
  );
}
