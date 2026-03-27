import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number | string;
  description?: string;
}

export interface SidebarConfig {
  branding: {
    title: string;
    subtitle?: string;
  };
  navigation: NavItem[];
  footer?: {
    settingsHref?: string;
    /** Toon een "Apps" knop met de AppSwitcher */
    showAppSwitcher?: boolean;
    userMenu?: {
      name: string;
      role: string;
      onSignOut: () => void;
    };
  };
}
