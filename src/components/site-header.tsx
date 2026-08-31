"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/content/site-config";

/**
 * On the home page at large sizes the name lives in the fixed left column
 * (see project-grid.tsx), so this top bar is hidden there. It stays on narrow
 * screens, where that fixed column has no room.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const hiddenOnLarge = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur sm:px-8 ${
        hiddenOnLarge ? "lg:hidden" : ""
      }`}
    >
      <Link href="/" className="text-sm font-medium tracking-tight">
        {siteConfig.name}
      </Link>
      <Link
        href="/info"
        className="label-caps text-muted transition-colors hover:text-foreground"
      >
        Info &amp; Contact
      </Link>
    </header>
  );
}
