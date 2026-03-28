import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  Textarea,
  KpiCard,
  SignalBadge,
  BandPill,
  StatCard,
} from "@oranje-wit/ui";

import {
  AvatarSection,
  IconButtonSection,
  ToggleSection,
  ChipSection,
  MetricSection,
  ProgressSection,
  SkeletonSection,
  EmptyStateSection,
  SearchInputSection,
  BottomNavSection,
  TopBarSection,
} from "./client-sections";

// ─── Section wrapper ──────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={id}
      className="py-6"
      style={{ borderBottom: "1px solid var(--border-default)" }}
    >
      <h2
        className="mb-5 text-[11px] font-semibold tracking-[0.15em] uppercase"
        style={{ color: "var(--ow-oranje-500, #ff8533)" }}
      >
        {title}
      </h2>
      <div className="px-1">{children}</div>
    </section>
  );
}

// ─── Component count ──────────────────────────────────────────────

const SECTION_COUNT = 18;

// ─── Page ─────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <header className="mb-10">
        <p
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: "var(--ow-oranje-500, #ff8533)" }}
        >
          OW Design System
        </p>
        <h1
          className="mt-1 text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Component Catalog
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {SECTION_COUNT} secties — Living style guide en visual regression target
        </p>
      </header>

      {/* ── 1. Buttons ──────────────────────────────────────────── */}
      <Section id="section-buttons" title="Buttons">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Varianten
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Disabled
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" disabled>
                Primary disabled
              </Button>
              <Button variant="secondary" disabled>
                Secondary disabled
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Sizes
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Badges ───────────────────────────────────────────── */}
      <Section id="section-badges" title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge color="green">Groen</Badge>
          <Badge color="orange">Oranje</Badge>
          <Badge color="red">Rood</Badge>
          <Badge color="blue">Blauw</Badge>
          <Badge color="yellow">Geel</Badge>
          <Badge color="gray">Grijs</Badge>
        </div>
      </Section>

      {/* ── 3. Cards ────────────────────────────────────────────── */}
      <Section id="section-cards" title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Card met Header
              </h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Dit is de body van een standaard card component met header en body secties.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Card zonder Header
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Een eenvoudige card met alleen een body sectie. Geschikt voor compacte content.
              </p>
            </CardBody>
          </Card>
        </div>
      </Section>

      {/* ── 4. Form Inputs ──────────────────────────────────────── */}
      <Section id="section-inputs" title="Form Inputs">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Standaard input" />
            <Input label="Met label" placeholder="Voer naam in..." />
          </div>
          <Input label="Met error" placeholder="Foutieve invoer" error="Dit veld is verplicht" />
          <Select label="Selectbox">
            <option value="">Kies een optie...</option>
            <option value="1">Optie 1</option>
            <option value="2">Optie 2</option>
            <option value="3">Optie 3</option>
          </Select>
          <Textarea label="Textarea" placeholder="Schrijf hier je opmerkingen..." rows={3} />
          <div>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              SearchInput (client component)
            </p>
            <SearchInputSection />
          </div>
        </div>
      </Section>

      {/* ── 5. Avatars ──────────────────────────────────────────── */}
      <Section id="section-avatars" title="Avatars">
        <AvatarSection />
      </Section>

      {/* ── 6. Icon Buttons ─────────────────────────────────────── */}
      <Section id="section-icon-buttons" title="Icon Buttons">
        <IconButtonSection />
      </Section>

      {/* ── 7. Toggles ──────────────────────────────────────────── */}
      <Section id="section-toggles" title="Toggles">
        <ToggleSection />
      </Section>

      {/* ── 8. Chips ────────────────────────────────────────────── */}
      <Section id="section-chips" title="Chips">
        <ChipSection />
      </Section>

      {/* ── 9. Metrics ──────────────────────────────────────────── */}
      <Section id="section-metrics" title="Metrics">
        <MetricSection />
      </Section>

      {/* ── 10. Progress Bars ───────────────────────────────────── */}
      <Section id="section-progress" title="Progress Bars">
        <ProgressSection />
      </Section>

      {/* ── 11. Signal Badges ───────────────────────────────────── */}
      <Section id="section-signal-badges" title="Signal Badges">
        <div className="flex flex-wrap items-center gap-3">
          <SignalBadge ernst="kritiek">Kritiek</SignalBadge>
          <SignalBadge ernst="aandacht">Aandacht</SignalBadge>
          <SignalBadge ernst="opkoers">Op koers</SignalBadge>
        </div>
      </Section>

      {/* ── 12. Band Pills ──────────────────────────────────────── */}
      <Section id="section-band-pills" title="Band Pills">
        <div className="flex flex-wrap items-center gap-3">
          <BandPill band="Blauw" />
          <BandPill band="Groen" />
          <BandPill band="Geel" />
          <BandPill band="Oranje" />
          <BandPill band="Rood" />
          <BandPill band="Senioren" />
        </div>
      </Section>

      {/* ── 13. Skeletons ───────────────────────────────────────── */}
      <Section id="section-skeletons" title="Skeletons">
        <SkeletonSection />
      </Section>

      {/* ── 14. Empty State ─────────────────────────────────────── */}
      <Section id="section-empty-state" title="Empty State">
        <EmptyStateSection />
      </Section>

      {/* ── 15. KPI Cards ───────────────────────────────────────── */}
      <Section id="section-kpi-cards" title="KPI Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Totaal leden"
            value={247}
            trend={{ value: 12, label: "t.o.v. vorig seizoen" }}
            signal="groen"
          />
          <KpiCard
            label="Jeugdleden"
            value={142}
            detail={{ instroom: 28, uitstroom: 16 }}
            signal="geel"
          />
          <KpiCard
            label="Uitstroom"
            value={18}
            subtitle="dit seizoen"
            trend={{ value: -5, label: "t.o.v. vorig jaar" }}
            signal="rood"
          />
        </div>
      </Section>

      {/* ── 16. Stat Cards ──────────────────────────────────────── */}
      <Section id="section-stat-cards" title="Stat Cards">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Standaard" value={42} />
          <StatCard label="Oranje" value="87%" color="orange" />
          <StatCard label="Rood" value={3} color="red" />
          <StatCard label="Groen" value={12} color="green" />
        </div>
      </Section>

      {/* ── 17. Bottom Nav ──────────────────────────────────────── */}
      <Section id="section-bottom-nav" title="Bottom Nav">
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Inline preview (niet fixed positioned)
        </p>
        <BottomNavSection />
      </Section>

      {/* ── 18. Top Bar ─────────────────────────────────────────── */}
      <Section id="section-top-bar" title="Top Bar">
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          Inline preview (niet fixed positioned)
        </p>
        <TopBarSection />
      </Section>

      {/* Footer */}
      <footer className="mt-10 pb-8 text-center">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          c.k.v. Oranje Wit Design System — {SECTION_COUNT} componentsecties
        </p>
      </footer>
    </div>
  );
}
