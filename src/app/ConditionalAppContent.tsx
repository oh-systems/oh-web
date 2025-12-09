"use client";

import { usePathname } from "next/navigation";
import AppContent from "./AppContent";

export default function ConditionalAppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Routes that should bypass AppContent (no loading screen)
  const bypassRoutes = ["/space", "/game"];

  // Check if current route should bypass AppContent
  const shouldBypass = bypassRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  // If bypassing, render children directly
  if (shouldBypass) {
    return <>{children}</>;
  }

  // Otherwise, use AppContent wrapper with loading screens
  return <AppContent>{children}</AppContent>;
}
