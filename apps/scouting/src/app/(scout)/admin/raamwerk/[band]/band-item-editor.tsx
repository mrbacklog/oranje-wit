"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";

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

  // ── Helpers ──────────────────────────────────────────────────

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
      const res = await fetch(`/api/admin/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij updaten item:", json.error?.message);
        return false;
      }
      // Update lokale state
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
      const res = await fetch(`/api/admin/items/${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij verwijderen item:", json.error?.message);
        return;
      }
      // Update lokale state — soft delete
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
        const res = await fetch("/api/admin/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pijlerId, ...data }),
        });
        const json = await res.json();
        if (!json.ok) {
          logger.warn("Fout bij aanmaken item:", json.error?.message);
          return false;
        }
        // Update lokale state
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
      // Zoek het item en zijn buur
      for (const pijler of pijlers) {
        const idx = pijler.items.findIndex((i) => i.id === itemId);
        if (idx === -1) continue;

        const buurIdx = richting === "omhoog" ? idx - 1 : idx + 1;
        if (buurIdx < 0 || buurIdx >= pijler.items.length) return;

        const item = pijler.items[idx];
        const buur = pijler.items[buurIdx];

        // Wissel volgordes
        await updateItem(item.id, { volgorde: buur.volgorde });
        await updateItem(buur.id, { volgorde: item.volgorde });

        // Refresh de pagina om de nieuwe volgorde te laden
        router.refresh();
        return;
      }
    },
    [pijlers, updateItem, router]
  );

  // ── Validatie status ─────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/raamwerk"
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

      {/* Versie info + kern teller */}
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
          <KernTeller huidig={kernItems.length} target={target} />
          <div className="text-text-secondary text-sm">{actieveItems.length} items totaal</div>
        </div>
      </div>

      {/* Niet bewerkbaar waarschuwing */}
      {!isEditable && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Deze versie is {versie.status.toLowerCase()} en kan niet worden bewerkt. Maak een nieuwe
          CONCEPT-versie aan om wijzigingen door te voeren.
        </div>
      )}

      {/* Pijlers */}
      <div className="space-y-4">
        {pijlers.map((pijler) => {
          const isExpanded = expandedPijlers.has(pijler.id);
          const validatie = getPijlerValidatie(pijler);

          return (
            <div
              key={pijler.id}
              className="bg-surface-card overflow-hidden rounded-2xl border border-white/10"
            >
              {/* Pijler header (accordion) */}
              <button
                onClick={() => togglePijler(pijler.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-card/5"
              >
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-text-muted transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <span className="font-semibold">{pijler.naam}</span>
                  <span className="text-text-muted text-xs uppercase">{pijler.code}</span>
                  {pijler.blok && (
                    <span className="text-text-muted rounded bg-surface-card/5 px-2 py-0.5 text-xs">
                      {pijler.blok}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Validatie indicator */}
                  {validatie.heeftKernItem ? (
                    <span className="text-emerald-400" title="Heeft kern-items">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-red-400" title="Geen kern-items">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <path d="m9 9 6 6" />
                      </svg>
                    </span>
                  )}
                  <span className="text-text-secondary text-sm">
                    {validatie.aantalKern} kern / {validatie.aantalActief} totaal
                  </span>
                </div>
              </button>

              {/* Items lijst */}
              {isExpanded && (
                <div className="border-t border-white/5 px-5 py-3">
                  {pijler.items.length === 0 ? (
                    <p className="text-text-muted py-4 text-center text-sm">
                      Geen items in deze pijler
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pijler.items.map((item, idx) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          isFirst={idx === 0}
                          isLast={idx === pijler.items.length - 1}
                          isEditable={isEditable}
                          isEditing={editingItem === item.id}
                          loading={loading}
                          onEdit={() => setEditingItem(editingItem === item.id ? null : item.id)}
                          onUpdate={(data) => updateItem(item.id, data)}
                          onDelete={() => deleteItem(item.id)}
                          onMove={(dir) => moveItem(item.id, dir)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Nieuw item */}
                  {isEditable && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      {nieuwItemPijler === pijler.id ? (
                        <NieuwItemForm
                          pijlerId={pijler.id}
                          pijlerCode={pijler.code}
                          loading={loading}
                          onCreate={createItem}
                          onCancel={() => setNieuwItemPijler(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setNieuwItemPijler(pijler.id)}
                          className="text-text-muted hover:text-ow-oranje flex items-center gap-2 text-sm transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                          </svg>
                          Item toevoegen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// KernTeller
// ============================================================

function KernTeller({ huidig, target }: { huidig: number; target: number }) {
  const status = huidig < 8 ? "te-weinig" : huidig > 12 ? "te-veel" : "goed";

  const kleur =
    status === "goed"
      ? "text-emerald-400"
      : status === "te-weinig"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className={`text-sm font-medium ${kleur}`}>
      {huidig} kern-items
      <span className="text-text-muted font-normal"> (target: {target})</span>
    </div>
  );
}

// ============================================================
// ItemRow
// ============================================================

function ItemRow({
  item,
  isFirst,
  isLast,
  isEditable,
  isEditing,
  loading,
  onEdit,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: ItemData;
  isFirst: boolean;
  isLast: boolean;
  isEditable: boolean;
  isEditing: boolean;
  loading: boolean;
  onEdit: () => void;
  onUpdate: (data: Partial<ItemData>) => Promise<boolean>;
  onDelete: () => void;
  onMove: (richting: "omhoog" | "omlaag") => void;
}) {
  const [editLabel, setEditLabel] = useState(item.label);
  const [editVraag, setEditVraag] = useState(item.vraagTekst);

  const handleSave = async () => {
    const success = await onUpdate({
      label: editLabel,
      vraagTekst: editVraag,
    });
    if (success) onEdit(); // sluit edit mode
  };

  if (!item.actief) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-surface-card/5 px-3 py-2 opacity-40">
        <span className="text-text-muted text-sm line-through">{item.label}</span>
        <span className="text-text-muted text-xs">(verwijderd)</span>
        {isEditable && (
          <button
            onClick={() => onUpdate({ actief: true })}
            disabled={loading}
            className="text-text-muted ml-auto text-xs transition-colors hover:text-emerald-400"
          >
            Herstellen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-lg border border-white/5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
                placeholder="Label"
              />
              <textarea
                value={editVraag}
                onChange={(e) => setEditVraag(e.target.value)}
                rows={2}
                className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
                placeholder="Formulering (min. 10 tekens)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading || editLabel.length < 3 || editVraag.length < 10}
                  className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setEditLabel(item.label);
                    setEditVraag(item.vraagTekst);
                    onEdit();
                  }}
                  className="text-text-secondary text-xs transition-colors hover:text-white"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                <span className="text-text-muted font-mono text-xs">{item.itemCode}</span>
                {item.isKern ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    kern
                  </span>
                ) : (
                  <span className="rounded-full bg-surface-card/10 px-2 py-0.5 text-xs text-white/40">
                    verdieping
                  </span>
                )}
                {item.categorie && (
                  <span className="text-text-muted text-xs">{item.categorie}</span>
                )}
              </div>
              <p className="text-text-secondary mt-1 text-sm">{item.vraagTekst}</p>
            </div>
          )}
        </div>

        {/* Acties */}
        {isEditable && !isEditing && (
          <div className="flex items-center gap-1">
            {/* Volgorde knoppen */}
            <button
              onClick={() => onMove("omhoog")}
              disabled={isFirst || loading}
              className="text-text-muted hover:text-text-primary rounded p-1 transition-colors disabled:opacity-30"
              title="Omhoog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <button
              onClick={() => onMove("omlaag")}
              disabled={isLast || loading}
              className="text-text-muted hover:text-text-primary rounded p-1 transition-colors disabled:opacity-30"
              title="Omlaag"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Kern toggle */}
            <button
              onClick={() => onUpdate({ isKern: !item.isKern })}
              disabled={loading}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                item.isKern
                  ? "text-emerald-400 hover:text-amber-400"
                  : "text-text-muted hover:text-emerald-400"
              }`}
              title={item.isKern ? "Markeer als verdieping" : "Markeer als kern"}
            >
              {item.isKern ? "Kern" : "Kern?"}
            </button>

            {/* Bewerken */}
            <button
              onClick={onEdit}
              disabled={loading}
              className="text-text-muted hover:text-ow-oranje rounded p-1 transition-colors"
              title="Bewerken"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              </svg>
            </button>

            {/* Verwijderen */}
            <button
              onClick={() => {
                if (confirm(`Weet je zeker dat je "${item.label}" wilt verwijderen?`)) {
                  onDelete();
                }
              }}
              disabled={loading}
              className="text-text-muted rounded p-1 transition-colors hover:text-red-400"
              title="Verwijderen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NieuwItemForm
// ============================================================

function NieuwItemForm({
  pijlerId,
  pijlerCode,
  loading,
  onCreate,
  onCancel,
}: {
  pijlerId: string;
  pijlerCode: string;
  loading: boolean;
  onCreate: (
    pijlerId: string,
    data: {
      itemCode: string;
      label: string;
      vraagTekst: string;
      isKern: boolean;
    }
  ) => Promise<boolean>;
  onCancel: () => void;
}) {
  const prefix = pijlerCode.toLowerCase().slice(0, 3);
  const [itemCode, setItemCode] = useState(`${prefix}_`);
  const [label, setLabel] = useState("");
  const [vraagTekst, setVraagTekst] = useState("");
  const [isKern, setIsKern] = useState(false);

  const codeGeldig = /^[a-z_]{3,50}$/.test(itemCode);
  const labelGeldig = label.length >= 3;
  const vraagGeldig = vraagTekst.length >= 10;
  const kanOpslaan = codeGeldig && labelGeldig && vraagGeldig && !loading;

  return (
    <div className="bg-surface-elevated space-y-3 rounded-xl border border-white/10 p-4">
      <h4 className="text-sm font-medium">Nieuw item</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-text-secondary mb-1 block text-xs">Item-code</label>
          <input
            type="text"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value.toLowerCase())}
            className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 font-mono text-sm outline-none"
            placeholder={`${prefix}_naam`}
          />
          {itemCode.length > 0 && !codeGeldig && (
            <p className="mt-1 text-xs text-red-400">Lowercase met underscores, min. 3 tekens</p>
          )}
        </div>
        <div>
          <label className="text-text-secondary mb-1 block text-xs">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
            placeholder="Korte naam"
          />
        </div>
      </div>
      <div>
        <label className="text-text-secondary mb-1 block text-xs">Formulering</label>
        <textarea
          value={vraagTekst}
          onChange={(e) => setVraagTekst(e.target.value)}
          rows={2}
          className="bg-surface-dark focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-1.5 text-sm outline-none"
          placeholder="Beschrijving van het observeerbare gedrag (min. 10 tekens)"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={isKern}
          onChange={(e) => setIsKern(e.target.checked)}
          className="accent-ow-oranje h-4 w-4 rounded"
        />
        <span className="text-sm">Kern-item (voor TEAM-methode)</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => onCreate(pijlerId, { itemCode, label, vraagTekst, isKern })}
          disabled={!kanOpslaan}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Toevoegen"}
        </button>
        <button
          onClick={onCancel}
          className="text-text-secondary text-sm transition-colors hover:text-white"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
