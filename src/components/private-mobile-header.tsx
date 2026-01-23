"use client";

import Link from "next/link";
import Image from "next/image";

import { SidebarTrigger } from "@/components/ui/sidebar";

export default function PrivateMobileHeader() {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-background/80 supports-backdrop-filter:backdrop-blur-sm border-b border-border">
      <div className="h-14 px-4 flex items-center gap-2">
        <SidebarTrigger />
        <Link href="/lists" className="flex items-center gap-2" aria-label="WaitQ lists">
          <Image src="/waitq-square.svg" alt="WaitQ" width={28} height={28} className="h-7 w-7" />
          <span className="text-sm font-semibold">WaitQ</span>
        </Link>
      </div>
    </div>
  );
}

