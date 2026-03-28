import type { AppManifest } from "./manifest";
import type { NavItem } from "./bottom-nav";
import {
  HomeIcon,
  SearchIcon,
  ListIcon,
  PeopleIcon,
  ProfileIcon,
  ChartIcon,
  StarIcon,
  SettingsIcon,
  GridIcon,
  CompareIcon,
} from "./bottom-nav";

const ICON_MAP: Record<string, (props: { active: boolean }) => React.ReactNode> = {
  HomeIcon,
  SearchIcon,
  ListIcon,
  PeopleIcon,
  ProfileIcon,
  ChartIcon,
  StarIcon,
  SettingsIcon,
  GridIcon,
  CompareIcon,
};

/** Converteer manifest-secties naar BottomNav items */
export function resolveBottomNav(manifest: AppManifest): NavItem[] {
  return manifest.sections.map((section) => ({
    label: section.nav.label,
    href: section.nav.href,
    icon: ICON_MAP[section.nav.icon] ?? GridIcon,
  }));
}
