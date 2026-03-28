"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";
import { PijlerAccordion } from "./pijler-accordion";

// ============================================================
// Types
// ============================================================

interface ItemData {
  id: string;
  itemCode: string;
  label: string;
  vraagTekst: string;
  isKern: boolean;
  categorie: string | null;
  volgorde: number;
  actief: boolean;
}

interface PijlerData {
  id: string;
  code: string;
  naam: string;
  icoon: string | null;
  volgorde: number;
  blok: string | null;
  items: ItemData[];
}

interface VersieInfo {
  id: string;
  seizoen: string;
  naam: string;
  status: string;
}

interface GroepInfo {
  id: string;
  kernItemsTarget: number | null;
  schaalType: string;
}

interface BandItemEditorProps {
  band: string;
  versie: VersieInfo;
  groep: GroepInfo;
  pijlers: PijlerData[];
}

// ============================================================
// Constanten
// ============================================================

const BAND_LABELS: Record<string, string> = {
  paars: "Paurs (4-5 jaar)",
  blauw: "Blauw (5-7 jaar)",
  groen: "Groen (8-9 jaar)",
  geel: "Geel (10-12 jaar)",
  oranje: "Oranje (13-15 jaar)",
  rood: "Rood (16-18 jaar)",
};

const BAND_DOT_KLEUREN: Record<string, string> = {
  paars: "bg-knkv-paars",
  blauw: "bg-knkv-blauw",
  groen: "bg-knkv-groen",
  geel: "bg-knkv-geel",
  oranje: "bg-knkv-oranje",
  rood: "bg-knkv-rood",
};

// ============================================================
// Component
// ============================================================

export function BandItemEditor({
  band,
  versie,
  groep,
  pijlers: initialPijlers,
}: BandItemEditorProps) {
  const router = useRouter();
  const [pijlers, setPijlers] = useState<PijlerData[]>(initialPijlers);
  const [expandedPijlers, setExpandedPijlers] = useState<Set<string>>(
    new Set(initialPijlers.map((p) => p.id))
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [nieuwItemPijler, setNieuwItemPijler] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditable = versie.status === "CONCEPT";

  // Tellingen
  const actieveItems = pijlers.flatMap((p) => p.items.filter((i) => i.actief));
  const kernItems = actieveItems.filter((i) => i.isKern);
  const target = groep.kernItemsTarget ?? 10;

  const togglePijler = (id: string) => {
    setExpandedPijlers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── API calls ────────────────────────────────────────────────

  const updateItem = useCallback(async (itemId: string, data: Partial<ItemData>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scouting/admin/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij updaten item:", json.error?.message);
        return false;
      }
      setPijlers((prev) =>
        prev.map((p) => ({
          ...p,
          items: p.items.map((i) => (i.id === itemId ? { ...i, ...json.data } : i)),
        }))
      );
      return true;
    } catch (error) {
      logger.warn("Fout bij updaten item:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scouting/admin/items/${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij verwijderen item:", json.error?.message);
        return;
      }
      setPijlers((prev) =>
        prev.map((p) => ({
          ...p,
          items: p.items.map((i) => (i.id === itemId ? { ...i, actief: false } : i)),
        }))
      );
    } catch (error) {
      logger.warn("Fout bij verwijderen item:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(
    async (
      pijlerId: string,
      data: { itemCode: string; label: string; vraagTekst: string; isKern: boolean }
    ) => {
      setLoading(true);
      try {
        const res = await fetch("/api/scouting/admin/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pijlerId, ...data }),
        });
        const json = await res.json();
        if (!json.ok) {
          logger.warn("Fout bij aanmaken item:", json.error?.message);
          return false;
        }
        setPijlers((prev) =>
          prev.map((p) => (p.id === pijlerId ? { ...p, items: [...p.items, json.data] } : p))
        );
        setNieuwItemPijler(null);
        return true;
      } catch (error) {
        logger.warn("Fout bij aanmaken item:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const moveItem = useCallback(
    async (itemId: string, richting: "omhoog" | "omlaag") => {
      for (const pijler of pijlers) {
        const idx = pijler.items.findIndex((i) => i.id === itemId);
        if (idx === -1) continue;

        const buurIdx = richting === "omhoog" ? idx - 1 : idx + 1;
        if (buurIdx < 0 || buurIdx >= pijler.items.length) return;

        const item = pijler.items[idx];
        const buur = pijler.items[buurIdx];

        await updateItem(item.id, { volgorde: buur.volgorde });
        await updateItem(buur.id, { volgorde: item.volgorde });

        router.refresh();
        return;
      }
    },
    [pijlers, updateItem, router]
  );

  function getPijlerValidatie(pijler: PijlerData) {
    const actief = pijler.items.filter((i) => i.actief);
    const kern = actief.filter((i) => i.isKern);
    return {
      heeftKernItem: kern.length > 0,
      heeftItems: actief.length > 0,
      aantalKern: kern.length,
      aantalActief: actief.length,
    };
  }

  return (
    <div className="space-y-6">
      <EditorHeader band={band} />

      <VersieInfoBar
        versie={versie}
        kernItems={kernItems.length}
        target={target}
        actieveItems={actieveItems.length}
      />

      {!isEditable && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Deze versie is {versie.status.toLowerCase()} en kan niet worden bewerkt. Maak een nieuwe
          CONCEPT-versie aan om wijzigingen door te voeren.
        </div>
      )}

      <div className="space-y-4">
        {pijlers.map((pijler) => (
          <PijlerAccordion
            key={pijler.id}
            pijler={pijler}
            isExpanded={expandedPijlers.has(pijler.id)}
            validatie={getPijlerValidatie(pijler)}
            isEditable={isEditable}
            editingItem={editingItem}
            nieuwItemPijler={nieuwItemPijler}
            loading={loading}
            onToggle={() => togglePijler(pijler.id)}
            onEditItem={(id) => setEditingItem(editingItem === id ? null : id)}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onMoveItem={moveItem}
            onCreateItem={createItem}
            onSetNieuwItemPijler={setNieuwItemPijler}
          />
        ))}
      </div>
    </div>
  );
}

// ── EditorHeader ──

function EditorHeader({ band }: { band: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/scouting/admin/raamwerk"
        className="text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Terug naar overzicht"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${BAND_DOT_KLEUREN[band] ?? ""}`} />
        <h2 className="text-2xl font-bold">{BAND_LABELS[band] ?? band}</h2>
      </div>
    </div>
  );
}

// ── VersieInfoBar ──

function VersieInfoBar({
  versie,
  kernItems,
  target,
  actieveItems,
}: {
  versie: VersieInfo;
  kernItems: number;
  target: number;
  actieveItems: number;
}) {
  const status = kernItems < 8 ? "te-weinig" : kernItems > 12 ? "te-veel" : "goed";
  const kleur =
    status === "goed"
      ? "text-emerald-400"
      : status === "te-weinig"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="bg-surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-4">
      <div className="text-sm">
        <span className="text-text-secondary">Versie:</span>{" "}
        <span className="font-medium">{versie.naam}</span>
        <span className="text-text-muted ml-2">({versie.seizoen})</span>
        <span
          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${
            versie.status === "CONCEPT"
              ? "bg-amber-500/20 text-amber-400"
              : versie.status === "ACTIEF"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-surface-card/10 text-white/40"
          }`}
        >
          {versie.status}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-sm font-medium ${kleur}`}>
          {kernItems} kern-items
          <span className="text-text-muted font-normal"> (target: {target})</span>
        </div>
        <div className="text-text-secondary text-sm">{actieveItems} items totaal</div>
      </div>
    </div>
  );
}
