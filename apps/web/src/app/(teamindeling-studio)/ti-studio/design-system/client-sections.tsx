"use client";

import { useState } from "react";
import {
  Avatar,
  IconButton,
  Toggle,
  Skeleton,
  Metric,
  ProgressBar,
  EmptyState,
  SearchInput,
  Chip,
  BottomNav,
  TopBar,
  HomeIcon,
  SearchIcon,
  PeopleIcon,
  ChartIcon,
} from "@oranje-wit/ui";

// ─── Avatars ──────────────────────────────────────────────────────

export function AvatarSection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Alle sizes */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Sizes: xs, sm, md, lg, xl, 2xl
        </p>
        <div className="flex items-end gap-4">
          <Avatar size="xs" initials="XS" />
          <Avatar size="sm" initials="SM" />
          <Avatar size="md" initials="MD" />
          <Avatar size="lg" initials="LG" />
          <Avatar size="xl" initials="XL" />
          <Avatar size="2xl" initials="2X" />
        </div>
      </div>

      {/* Met online indicator */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Met online indicator
        </p>
        <div className="flex items-end gap-4">
          <Avatar size="md" initials="ON" online />
          <Avatar size="lg" initials="ON" online />
          <Avatar size="xl" initials="ON" online />
        </div>
      </div>

      {/* Met ring (active) */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Active (gradient ring)
        </p>
        <div className="flex items-end gap-4">
          <Avatar size="md" initials="AC" active />
          <Avatar size="lg" initials="AC" active ageColor="#3b82f6" />
          <Avatar size="xl" initials="AC" active ageColor="#22c55e" />
        </div>
      </div>

      {/* Leeftijdskleuren */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Leeftijdskleuren (ageColor)
        </p>
        <div className="flex items-end gap-4">
          <Avatar size="lg" initials="BL" ageColor="#3b82f6" />
          <Avatar size="lg" initials="GR" ageColor="#22c55e" />
          <Avatar size="lg" initials="GL" ageColor="#eab308" />
          <Avatar size="lg" initials="OR" ageColor="#f97316" />
          <Avatar size="lg" initials="RD" ageColor="#ef4444" />
        </div>
      </div>
    </div>
  );
}

// ─── Icon Buttons ─────────────────────────────────────────────────

const PlusIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export function IconButtonSection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Varianten */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Varianten: default, ghost, accent
        </p>
        <div className="flex items-center gap-3">
          <IconButton icon={PlusIcon} variant="default" label="Toevoegen" />
          <IconButton icon={EditIcon} variant="ghost" label="Bewerken" />
          <IconButton icon={TrashIcon} variant="accent" label="Verwijderen" />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Sizes: sm, md, lg
        </p>
        <div className="flex items-center gap-3">
          <IconButton icon={PlusIcon} size="sm" label="Klein" />
          <IconButton icon={PlusIcon} size="md" label="Medium" />
          <IconButton icon={PlusIcon} size="lg" label="Groot" />
        </div>
      </div>

      {/* Disabled */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Disabled
        </p>
        <div className="flex items-center gap-3">
          <IconButton icon={PlusIcon} variant="default" label="Disabled default" disabled />
          <IconButton icon={EditIcon} variant="accent" label="Disabled accent" disabled />
        </div>
      </div>
    </div>
  );
}

// ─── Toggles ──────────────────────────────────────────────────────

export function ToggleSection() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Toggle checked={on} onChange={setOn} label="Ingeschakeld" />
      <Toggle checked={off} onChange={setOff} label="Uitgeschakeld" />
      <Toggle checked={true} onChange={() => {}} disabled label="Disabled (aan)" />
      <Toggle checked={false} onChange={() => {}} disabled label="Disabled (uit)" />
    </div>
  );
}

// ─── Chips ────────────────────────────────────────────────────────

export function ChipSection() {
  const [selected, setSelected] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Default en selected */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Default, selected, met kleur-dot
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Default" />
          <Chip label="Klik mij" selected={selected} onSelect={() => setSelected(!selected)} />
          <Chip label="Geselecteerd" selected />
          <Chip label="Blauw" color="#3b82f6" />
          <Chip label="Groen" color="#22c55e" />
        </div>
      </div>

      {/* Met remove knop */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Met remove knop
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Verwijderbaar" onRemove={() => {}} />
          <Chip label="Selected + remove" selected onRemove={() => {}} />
          <Chip label="Kleur + remove" color="#f97316" onRemove={() => {}} />
        </div>
      </div>
    </div>
  );
}

// ─── Metrics ──────────────────────────────────────────────────────

export function MetricSection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Groot getal met trend up */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          value={247}
          label="Totaal leden"
          trend="up"
          trendValue="+12%"
          gradient="oranje"
          withCard
        />
        <Metric
          value={18}
          label="Uitstroom"
          trend="down"
          trendValue="-3"
          gradient="#ef4444"
          withCard
        />
        <Metric
          value={92.5}
          label="Retentie"
          suffix="%"
          decimals={1}
          sparkData={[85, 87, 88, 90, 89, 91, 92, 92.5]}
          gradient="oranje"
          withCard
        />
      </div>
    </div>
  );
}

// ─── Progress Bars ────────────────────────────────────────────────

export function ProgressSection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Verschillende waarden */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Auto color (rood → geel → groen)
        </p>
        <div className="flex flex-col gap-4">
          <ProgressBar value={25} label="25%" showValue size="md" />
          <ProgressBar value={50} label="50%" showValue size="md" />
          <ProgressBar value={75} label="75%" showValue size="md" />
          <ProgressBar value={100} label="100%" showValue size="md" />
        </div>
      </div>

      {/* Verschillende kleuren */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Custom kleuren
        </p>
        <div className="flex flex-col gap-4">
          <ProgressBar value={60} label="Oranje" showValue color="#ff8533" />
          <ProgressBar value={80} label="Blauw" showValue color="#3b82f6" />
          <ProgressBar
            value={45}
            label="Gradient"
            showValue
            color={{ from: "#8b5cf6", to: "#ec4899" }}
          />
        </div>
      </div>

      {/* Verschillende sizes */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Sizes: sm, md, lg
        </p>
        <div className="flex flex-col gap-4">
          <ProgressBar value={70} label="Small" showValue size="sm" color="#22c55e" />
          <ProgressBar value={70} label="Medium" showValue size="md" color="#22c55e" />
          <ProgressBar value={70} label="Large" showValue size="lg" color="#22c55e" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────

export function SkeletonSection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Text (3 lines)
        </p>
        <Skeleton variant="text" lines={3} />
      </div>

      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Circle
        </p>
        <div className="flex gap-3">
          <Skeleton variant="circle" height={32} />
          <Skeleton variant="circle" height={48} />
          <Skeleton variant="circle" height={64} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Card
        </p>
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────

export function EmptyStateSection() {
  return (
    <EmptyState
      title="Geen spelers gevonden"
      description="Er zijn nog geen spelers toegevoegd aan dit scenario. Gebruik de blauwdruk om te beginnen met de teamindeling."
      action={{ label: "Naar blauwdruk", onClick: () => {} }}
    />
  );
}

// ─── Search Input ─────────────────────────────────────────────────

export function SearchInputSection() {
  const [value, setValue] = useState("");
  return <SearchInput value={value} onChange={setValue} placeholder="Zoek een speler..." />;
}

// ─── Bottom Nav (inline) ──────────────────────────────────────────

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/zoeken", label: "Zoeken", icon: SearchIcon },
  { href: "/spelers", label: "Spelers", icon: PeopleIcon },
  { href: "/stats", label: "Stats", icon: ChartIcon },
];

export function BottomNavSection() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        height: 80,
        borderColor: "var(--border-default)",
        backgroundColor: "var(--surface-card)",
        transform: "translateZ(0)",
      }}
    >
      <BottomNav items={navItems} />
    </div>
  );
}

// ─── Top Bar (inline) ─────────────────────────────────────────────

export function TopBarSection() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        height: 64,
        borderColor: "var(--border-default)",
        backgroundColor: "var(--surface-page)",
        transform: "translateZ(0)",
      }}
    >
      <TopBar
        title="Teamindeling"
        subtitle="Seizoen 2025-2026"
        onBack={() => {}}
        actions={<IconButton icon={PlusIcon} variant="accent" size="sm" label="Nieuw" />}
      />
    </div>
  );
}
