// Data display
export { KpiCard } from "./data-display/kpi-card";
export { SignalBadge } from "./data-display/signal-badge";
export { BandPill } from "./data-display/band-pill";
export { StatCard } from "./data-display/stat-card";
export { SpelersKaart } from "./data-display/spelers-kaart";
export { Metric } from "./data-display/metric";
export { ProgressBar } from "./data-display/progress-bar";
export { RadarChart } from "./data-display/radar-chart";
export { EmptyState } from "./data-display/empty-state";

// Layout
export { AppShell } from "./layout/app-shell";
export { DomainShell } from "./layout/domain-shell";
export type {
  DomainShellProps,
  DomainNavItem,
  DomainNavSection,
  DomainSidebarConfig,
} from "./layout/domain-shell";
export { PageHeader } from "./layout/page-header";
export { StickyHeader } from "./layout/sticky-header";
export type { StickyHeaderProps } from "./layout/sticky-header";
export { PageContainer } from "./layout/page-container";
export type { PageContainerProps } from "./layout/page-container";
export { Sidebar } from "./layout/sidebar";
export type { NavItem as SidebarNavItem, SidebarConfig } from "./layout/types";

// Navigation
export { BottomNav } from "./navigation/bottom-nav";
export type { NavItem, BottomNavProps } from "./navigation/bottom-nav";
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
export { BottomNavShell, FloatingAppSwitcherFab } from "./navigation/bottom-nav-shell";
export type { BottomNavShellProps } from "./navigation/bottom-nav-shell";
export { AppSwitcher } from "./navigation/app-switcher";
export type { AppSwitcherProps, AppSwitcherProfile, AppInfo } from "./navigation/app-switcher";
export {
  MonitorIcon as MonitorAppIcon,
  TeamIndelingIcon as TeamIndelingAppIcon,
  EvaluatieIcon as EvaluatieAppIcon,
  ScoutingIcon as ScoutingAppIcon,
  BeheerIcon as BeheerAppIcon,
  APP_ICONS,
  APP_ACCENTS,
  APP_IDS,
  APP_META,
} from "./navigation/app-icons";
export type { AppIconProps, AppId } from "./navigation/app-icons";

// Primitives
export { Button } from "./primitives/button";
export { Badge } from "./primitives/badge";
export { Card, CardHeader, CardBody } from "./primitives/card";
export { Dialog } from "./primitives/dialog";
export { Input } from "./primitives/input";
export { Select } from "./primitives/select";
export { Textarea } from "./primitives/textarea";
export { Avatar } from "./primitives/avatar";
export { IconButton } from "./primitives/icon-button";
export { Toggle } from "./primitives/toggle";
export { Skeleton } from "./primitives/skeleton";
export { Tooltip } from "./primitives/tooltip";

// Data Input
export { SearchInput } from "./data-input/search-input";
export { Chip } from "./data-input/chip";
export { GetalInput } from "./data-input/getal-input";
export { JaNeeToggle } from "./data-input/ja-nee-toggle";
export { KeuzeRadio } from "./data-input/keuze-radio";
export { BezettingsRange, type BezettingsRangeValue } from "./data-input/bezettings-range";

// Feedback
export { InfoDrawer } from "./feedback/info-drawer";
export { InfoButton } from "./feedback/info-button";
export { BottomSheet } from "./feedback/bottom-sheet";
export type { BottomSheetProps } from "./feedback/bottom-sheet";
export { ToastProvider, useToast } from "./feedback/toast";
export { ConfirmDialog } from "./feedback/confirm-dialog";
export type { ConfirmDialogProps } from "./feedback/confirm-dialog";

// Overlay
export { Drawer } from "./overlay/drawer";
export type { DrawerProps } from "./overlay/drawer";
export { Popover } from "./overlay/popover";
export type { PopoverProps } from "./overlay/popover";
