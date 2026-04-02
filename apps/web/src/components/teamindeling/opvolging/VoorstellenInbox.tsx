"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from "lucide-react";
import {
  verwerkVoorstel,
  wijsVoorstelAf,
  bevestigGezienStatus,
  wijsGezienStatusAf,
  type VoorstelItem,
  type GezienVoorstelItem,
} from "@/app/(teamindeling-studio)/ti-studio/opvolging/voorstel-actions";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";

// ============================================================
// TYPES
// ============================================================

const TYPE_LABELS: Record<string, string> = {
  SPELERWIJZIGING: "Spelerwijziging",
  TEAMSTRUCTUUR: "Teamstructuur",
  OVERIG: "Overig",
};

const TYPE_COLORS: Record<string, string> = {
  SPELERWIJZIGING: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  TEAMSTRUCTUUR: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  OVERIG: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30",
};

const GEZIEN_COLORS: Record<string, string> = {
  GROEN: "bg-green-500/15 text-green-400 border border-green-500/30",
  GEEL: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  ORANJE: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  ROOD: "bg-red-500/15 text-red-400 border border-red-500/30",
  ONGEZIEN: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30",
};

const GEZIEN_DOT: Record<string, string> = {
  GROEN: "bg-green-500",
  GEEL: "bg-yellow-400",
  ORANJE: "bg-orange-500",
  ROOD: "bg-red-500",
  ONGEZIEN: "bg-zinc-500",
};

// ============================================================
// COORDINATOR VOORSTELLEN
// ============================================================

function formatTijdstip(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface VoorstelKaartProps {
  voorstel: VoorstelItem;
  onVerwerkt: () => void;
  onAfgewezen: () => void;
}

function VoorstelKaart({ voorstel, onVerwerkt, onAfgewezen }: VoorstelKaartProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleVerwerken() {
    startTransition(async () => {
      const result = await verwerkVoorstel(voorstel.id);
      if (result.ok) {
        onVerwerkt();
      } else {
        logger.warn("Verwerken mislukt:", result.error);
      }
    });
  }

  function handleAfwijzen() {
    startTransition(async () => {
      const result = await wijsVoorstelAf(voorstel.id);
      if (result.ok) {
        onAfgewezen();
      } else {
        logger.warn("Afwijzen mislukt:", result.error);
      }
    });
  }

  function handleWhatIf() {
    const params = new URLSearchParams();
    if (voorstel.spelerId) params.set("spelerId", voorstel.spelerId);
    if (voorstel.teamNaam) params.set("team", voorstel.teamNaam);
    router.push(`/ti-studio/indeling?${params.toString()}`);
  }

  const typeLabel = TYPE_LABELS[voorstel.type] ?? voorstel.type;
  const typeColor = TYPE_COLORS[voorstel.type] ?? TYPE_COLORS.OVERIG;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border p-4"
      style={{
        background: "var(--bg-secondary, #141414)",
        borderColor: "var(--border, #2a2a2a)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${typeColor}`}
            >
              {typeLabel}
            </span>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted, #666)" }}
            >
              <User size={11} />
              <span>{voorstel.coordinator.naam}</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted, #666)" }}
            >
              <Clock size={11} />
              <span>{formatTijdstip(voorstel.createdAt)}</span>
            </div>
          </div>

          <button onClick={() => setExpanded((v) => !v)} className="mt-2 w-full text-left">
            <p
              className={`text-sm leading-snug ${expanded ? "" : "line-clamp-2"}`}
              style={{ color: "var(--text-primary, #fafafa)" }}
            >
              {voorstel.omschrijving}
            </p>
            {voorstel.omschrijving.length > 120 && (
              <span
                className="mt-0.5 flex items-center gap-1 text-xs"
                style={{ color: "var(--ow-accent, #FF6B00)" }}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={12} /> Minder
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> Meer
                  </>
                )}
              </span>
            )}
          </button>

          {voorstel.teamNaam && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary, #a3a3a3)" }}>
              Team: {voorstel.teamNaam}
            </p>
          )}
        </div>
      </div>

      {/* Acties */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleVerwerken}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ background: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a44" }}
        >
          <CheckCircle2 size={13} />
          Verwerken
        </button>

        <button
          onClick={handleAfwijzen}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ background: "transparent", color: "#f87171", border: "1px solid #ef444444" }}
        >
          <XCircle size={13} />
          Afwijzen
        </button>

        {(voorstel.spelerId || voorstel.teamNaam) && (
          <button
            onClick={handleWhatIf}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "#FF6B0022", color: "#FF6B00", border: "1px solid #FF6B0044" }}
          >
            <FlaskConical size={13} />
            Onderzoeken als what-if
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// GEZIEN-STATUS VOORSTELLEN
// ============================================================

interface GezienVoorstelKaartProps {
  item: GezienVoorstelItem;
  onBevestigd: () => void;
  onAfgewezen: () => void;
}

function GezienVoorstelKaart({ item, onBevestigd, onAfgewezen }: GezienVoorstelKaartProps) {
  const [isPending, startTransition] = useTransition();

  const statusLabel = item.gezienStatusVoorgesteld as string;
  const dotColor = GEZIEN_DOT[statusLabel] ?? GEZIEN_DOT.ONGEZIEN;
  const badgeColor = GEZIEN_COLORS[statusLabel] ?? GEZIEN_COLORS.ONGEZIEN;

  function handleBevestigen() {
    startTransition(async () => {
      const result = await bevestigGezienStatus(item.id);
      if (result.ok) {
        onBevestigd();
      } else {
        logger.warn("Bevestigen mislukt:", result.error);
      }
    });
  }

  function handleAfwijzen() {
    startTransition(async () => {
      const result = await wijsGezienStatusAf(item.id);
      if (result.ok) {
        onAfgewezen();
      } else {
        logger.warn("Afwijzen mislukt:", result.error);
      }
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border p-3.5"
      style={{
        background: "var(--bg-secondary, #141414)",
        borderColor: "var(--border, #2a2a2a)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary, #fafafa)" }}>
              {item.spelerNaam}
            </span>
            {item.teamNaam && (
              <span className="text-xs" style={{ color: "var(--text-secondary, #a3a3a3)" }}>
                {item.teamNaam}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${badgeColor}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              {statusLabel}
            </span>
          </div>

          {item.gezienVoorgesteldNotitie && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary, #a3a3a3)" }}>
              {item.gezienVoorgesteldNotitie}
            </p>
          )}

          <div
            className="mt-1 flex items-center gap-3 text-xs"
            style={{ color: "var(--text-muted, #666)" }}
          >
            {item.gezienVoorgesteldDoor && (
              <span className="flex items-center gap-1">
                <User size={10} />
                {item.gezienVoorgesteldDoor}
              </span>
            )}
            {item.gezienVoorgesteldOp && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatTijdstip(item.gezienVoorgesteldOp)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleBevestigen}
            disabled={isPending}
            className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a44" }}
            aria-label={`Bevestig status ${statusLabel} voor ${item.spelerNaam}`}
          >
            <CheckCircle2 size={12} />
            Bevestig
          </button>
          <button
            onClick={handleAfwijzen}
            disabled={isPending}
            className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "transparent", color: "#f87171", border: "1px solid #ef444444" }}
            aria-label={`Wijs status ${statusLabel} af voor ${item.spelerNaam}`}
          >
            <XCircle size={12} />
            Afwijzen
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface VoorstellenInboxProps {
  initialVoorstellen: VoorstelItem[];
  initialGezienVoorstellen: GezienVoorstelItem[];
}

export default function VoorstellenInbox({
  initialVoorstellen,
  initialGezienVoorstellen,
}: VoorstellenInboxProps) {
  const [voorstellen, setVoorstellen] = useState(initialVoorstellen);
  const [gezienVoorstellen, setGezienVoorstellen] = useState(initialGezienVoorstellen);

  // Groepeer voorstellen per type
  const groepenVoorstellen = voorstellen.reduce<Record<string, VoorstelItem[]>>((acc, v) => {
    const key = v.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const typeVolgorde = ["SPELERWIJZIGING", "TEAMSTRUCTUUR", "OVERIG"];
  const gesorteerdeGroepen = typeVolgorde.filter((t) => groepenVoorstellen[t]?.length > 0);

  // Overige types die niet in volgorde staan
  for (const key of Object.keys(groepenVoorstellen)) {
    if (!gesorteerdeGroepen.includes(key)) gesorteerdeGroepen.push(key);
  }

  function removeVoorstel(id: string) {
    setVoorstellen((prev) => prev.filter((v) => v.id !== id));
  }

  function removeGezienVoorstel(id: string) {
    setGezienVoorstellen((prev) => prev.filter((v) => v.id !== id));
  }

  const heeftInhoud = voorstellen.length > 0 || gezienVoorstellen.length > 0;

  if (!heeftInhoud) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{ borderColor: "var(--border, #2a2a2a)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary, #a3a3a3)" }}>
          Geen openstaande voorstellen of gezien-updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coordinator voorstellen */}
      {gesorteerdeGroepen.length > 0 && (
        <section>
          <h3
            className="mb-3 text-sm font-semibold tracking-wide uppercase"
            style={{ color: "var(--text-secondary, #a3a3a3)" }}
          >
            Voorstellen van coördinatoren
          </h3>
          <div className="space-y-4">
            {gesorteerdeGroepen.map((type) => (
              <div key={type}>
                <p
                  className="mb-2 text-xs font-medium"
                  style={{ color: "var(--text-muted, #666)" }}
                >
                  {TYPE_LABELS[type] ?? type} ({groepenVoorstellen[type].length})
                </p>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {groepenVoorstellen[type].map((voorstel) => (
                      <VoorstelKaart
                        key={voorstel.id}
                        voorstel={voorstel}
                        onVerwerkt={() => removeVoorstel(voorstel.id)}
                        onAfgewezen={() => removeVoorstel(voorstel.id)}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gezien-status voorstellen */}
      {gezienVoorstellen.length > 0 && (
        <section>
          <h3
            className="mb-3 text-sm font-semibold tracking-wide uppercase"
            style={{ color: "var(--text-secondary, #a3a3a3)" }}
          >
            Gezien-updates ter bevestiging ({gezienVoorstellen.length})
          </h3>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {gezienVoorstellen.map((item) => (
                <GezienVoorstelKaart
                  key={item.id}
                  item={item}
                  onBevestigd={() => removeGezienVoorstel(item.id)}
                  onAfgewezen={() => removeGezienVoorstel(item.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
