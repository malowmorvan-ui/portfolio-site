"use client";

import { usePathname } from "next/navigation";
import { siteConfig } from "@/content/site-config";

export function SiteFooter() {
  const pathname = usePathname();

  // The home page is a full-bleed scroll of projects: a footer bar after the
  // last one breaks the rhythm, so the credits live on /info instead.
  if (pathname === "/") return null;

  return (
    <footer className="border-t border-border px-5 py-6 sm:px-8">
      <p className="label-caps text-muted">{siteConfig.footerCredits}</p>
    </footer>
  );
}
