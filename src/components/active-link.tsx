"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ActiveLink({ href, children, className, activeClassName }: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + "/");
  const cls = `${className || ""} ${isActive ? (activeClassName || "bg-neutral-100 text-black border border-orange-500") : ""}`.trim();
  return (
    <Link href={href} className={cls} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}


