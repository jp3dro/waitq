"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable link component with arrow icon that rotates on hover.
 * Used for marketing section CTAs throughout the site.
 */
export function ArrowLink({ href, children, className = "" }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-md font-medium text-foreground hover:text-primary transition-colors group ${className}`}
    >
      <span className="border-b border-foreground group-hover:border-primary">
        {children}
      </span>
      <ArrowUpRight className="w-4 h-4 group-hover:text-primary group-hover:rotate-45 transition-transform" />
    </Link>
  );
}
