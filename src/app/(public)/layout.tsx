import Nav from "@/components/nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
    </div>
  );
}


