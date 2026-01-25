import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SeatingPreferenceBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("h-8 px-3 text-sm", className)}
    >
      {children}
    </Badge>
  );
}
