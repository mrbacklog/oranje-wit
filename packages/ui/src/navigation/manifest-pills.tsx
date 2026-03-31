"use client";

import { usePathname } from "next/navigation";
import { Pills } from "./pills";
import type { AppManifest, ManifestSection } from "./manifest";

/**
 * ManifestPills — Rendert automatisch pills op basis van manifest + pathname.
 *
 * Bepaalt welke BottomNav-sectie actief is op basis van het huidige pad,
 * en toont de pills als die sectie ze heeft gedefinieerd.
 *
 * Matching-logica:
 * 1. Check of pathname matcht op een pill-href binnen een sectie
 * 2. Fallback: check of pathname matcht op de sectie nav-href
 * Dit zorgt ervoor dat navigatie VIA pills de pills zichtbaar houdt,
 * ook als de pill-route niet onder het nav-href pad valt.
 */
export function ManifestPills({ manifest }: { manifest: AppManifest }) {
  const pathname = usePathname();

  const activeSection = findActiveSection(manifest.sections, pathname);

  if (!activeSection?.pills || activeSection.pills.length === 0) return null;

  return (
    <Pills
      items={activeSection.pills}
      accentColor={manifest.accent}
      layoutKey={`pills-${manifest.id}`}
    />
  );
}

/** Matches een pad (met optionele query) tegen pathname */
function matchPath(href: string, pathname: string): boolean {
  const [path] = href.split("?");
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

/**
 * Vind de sectie die bij het huidige pad hoort.
 * Eerst: check of pathname matcht op een van de pill-hrefs.
 * Dan: check of pathname matcht op de nav-href (meest specifieke eerst).
 */
function findActiveSection(
  sections: readonly ManifestSection[],
  pathname: string
): ManifestSection | undefined {
  // 1. Check of pathname matcht op een pill-href
  for (const section of sections) {
    if (!section.pills) continue;
    for (const pill of section.pills) {
      if (matchPath(pill.href, pathname)) return section;
    }
  }

  // 2. Fallback: match op nav-href (meest specifieke eerst)
  return [...sections]
    .sort((a, b) => b.nav.href.split("?")[0].length - a.nav.href.split("?")[0].length)
    .find((section) => matchPath(section.nav.href, pathname));
}
