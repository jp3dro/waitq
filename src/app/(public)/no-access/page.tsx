import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">No Organization Access</h1>
          <p className="text-muted-foreground">
            You don't currently have access to any organization. Please contact your organization administrator for assistance.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/auth/logout">
              Log out
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
