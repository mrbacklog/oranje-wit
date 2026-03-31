// ─── Data display ────────────────────────────────────────────────
export { KpiCard } from "./data-display/kpi-card";
export { SignalBadge } from "./data-display/signal-badge";
export { BandPill } from "./data-display/band-pill";
export { StatCard } from "./data-display/stat-card";
export { SpelersKaart } from "./data-display/spelers-kaart";
export { EmptyState } from "./data-display/empty-state";
export { Metric } from "./data-display/metric";
export { ProgressBar } from "./data-display/progress-bar";

// ─── Data input ──────────────────────────────────────────────────
export { Chip } from "./data-input/chip";
export { SearchInput } from "./data-input/search-input";
export { GetalInput } from "./data-input/getal-input";
export { JaNeeToggle } from "./data-input/ja-nee-toggle";
export { KeuzeRadio } from "./data-input/keuze-radio";
export { BezettingsRange, type BezettingsRangeValue } from "./data-input/bezettings-range";

// ─── Layout ──────────────────────────────────────────────────────
export { AppShell } from "./layout/app-shell";
export { PageHeader } from "./layout/page-header";
export { Sidebar } from "./layout/sidebar";
export { DomainShell } from "./layout/domain-shell";
export type {
  DomainShellProps,
  DomainNavItem,
  DomainNavSection,
  DomainSidebarConfig,
} from "./layout/domain-shell";
export { PageContainer } from "./layout/page-container";
export type { PageContainerProps } from "./layout/page-container";
export type { NavItem, SidebarConfig } from "./layout/types";

// ─── Primitives ──────────────────────────────────────────────────
export { Button } from "./primitives/button";
export { Badge } from "./primitives/badge";
export { Card, CardHeader, CardBody } from "./primitives/card";
export { Dialog } from "./primitives/dialog";
export { Input } from "./primitives/input";
export { Select } from "./primitives/select";
export { Textarea } from "./primitives/textarea";
export { Avatar } from "./primitives/avatar";
export { IconButton } from "./primitives/icon-button";
export { Skeleton } from "./primitives/skeleton";
export { Toggle } from "./primitives/toggle";
export { Tooltip } from "./primitives/tooltip";

// ─── Feedback ────────────────────────────────────────────────────
export { InfoDrawer } from "./feedback/info-drawer";
export { InfoButton } from "./feedback/info-button";
export { ConfirmDialog } from "./feedback/confirm-dialog";
export { Toast } from "./feedback/toast";
export { BottomSheet } from "./feedback/bottom-sheet";

// ─── Overlay ─────────────────────────────────────────────────────
export { Drawer } from "./overlay/drawer";
export type { DrawerProps } from "./overlay/drawer";
export { Popover } from "./overlay/popover";
export type { PopoverProps } from "./overlay/popover";

// ─── Navigation — icons ──────────────────────────────────────────
export { APP_ICONS, APP_IDS, APP_META } from "./navigation/app-icons";
export type { AppId, AppIconProps } from "./navigation/app-icons";
export { APP_ACCENTS } from "./navigation/icons/types";
export { MonitorIcon } from "./navigation/icons/monitor-icon";
export { TeamIndelingIcon } from "./navigation/icons/team-indeling-icon";
export { EvaluatieIcon } from "./navigation/icons/evaluatie-icon";
export { ScoutingIcon } from "./navigation/icons/scouting-icon";
export { BeheerIcon } from "./navigation/icons/beheer-icon";
export { BeleidIcon } from "./navigation/icons/beleid-icon";
export { WwwIcon } from "./navigation/icons/www-icon";

// ─── Navigation — components ─────────────────────────────────────
export { BottomNav } from "./navigation/bottom-nav";
export type { BottomNavProps } from "./navigation/bottom-nav";
export {
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
} from "./navigation/bottom-nav";
export { TopBar } from "./navigation/top-bar";
export type { TopBarProps } from "./navigation/top-bar";
export { AppSwitcher } from "./navigation/app-switcher";
export type { AppSwitcherProps, AppSwitcherProfile, AppInfo } from "./navigation/app-switcher";
export { Pills } from "./navigation/pills";
export type { PillItem, PillsProps } from "./navigation/pills";
export { BottomNavShell, FloatingAppSwitcherFab } from "./navigation/bottom-nav-shell";

// ─── Navigation — manifest ───────────────────────────────────────
export {
  WWW,
  MONITOR,
  TEAM_INDELING,
  TEAM_INDELING_MOBILE,
  EVALUATIE,
  SCOUTING,
  BEHEER,
  BELEID,
  APP_MANIFEST,
  ALL_APPS,
} from "./navigation/manifest";
export type {
  NavIconComponent,
  ManifestNavItem,
  ManifestPill,
  ManifestSection,
  AppManifest,
} from "./navigation/manifest";
export { resolveBottomNav } from "./navigation/manifest-resolve";

// ─── Motion ──────────────────────────────────────────────────────
export {
  springSnappy,
  springGentle,
  springOverlay,
  easeOut,
  easeFast,
  fadeIn,
  slideUp,
  slideIn,
  scaleIn,
  staggerContainer,
  staggerItem,
  cardFlip,
  cardReveal,
  hapticBounce,
  hoverLift,
  cardInteraction,
  bottomSheet,
  overlayBackdrop,
  toastSlide,
  actionSheet,
  dialogScale,
  drawerSlide,
  popoverScale,
  carouselSlide,
} from "./motion/variants";
