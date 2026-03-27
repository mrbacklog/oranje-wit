/* eslint-disable max-lines */
"use client";

import { useState, useTransition } from "react";
import { Button, Badge, Card, CardBody, Input, Dialog } from "@oranje-wit/ui";
import {
  createItem,
  updateItem,
  deleteItem,
  updateGroepSettings,
  type RaamwerkDetail,
  type RaamwerkItemDetail,
} from "./actions";
import { publiceerRaamwerk, archiveerRaamwerk, type ValidationResult } from "../actions";
import { PIJLER_ICON_MAP } from "@/components/beheer/icons";

// ── Band metadata ─────────────────────────────────────────────

const BANDS = [
  { code: "blauw", label: "Blauw", kleur: "bg-blue-900/30 text-blue-400", ring: "ring-blue-500" },
  {
    code: "groen",
    label: "Groen",
    kleur: "bg-green-900/30 text-green-400",
    ring: "ring-green-500",
  },
  {
    code: "geel",
    label: "Geel",
    kleur: "bg-yellow-900/30 text-yellow-400",
    ring: "ring-yellow-500",
  },
  {
    code: "oranje",
    label: "Oranje",
    kleur: "bg-orange-900/30 text-orange-400",
    ring: "ring-orange-500",
  },
  { code: "rood", label: "Rood", kleur: "bg-red-900/30 text-red-400", ring: "ring-red-500" },
] as const;

const LAAG_LABELS: Record<string, { label: string; color: "blue" | "orange" | "green" }> = {
  technisch: { label: "T", color: "blue" },
  tactisch: { label: "Ta", color: "orange" },
  mentaal: { label: "M", color: "green" },
};

const SCHAAL_LABELS: Record<string, string> = {
  duim: "Duim (0-2)",
  smiley: "Smiley (0-3)",
  sterren: "Sterren (0-5)",
  slider: "Slider (0-99)",
};

// ── Hoofd-component ───────────────────────────────────────────

interface Props {
  versie: RaamwerkDetail;
  validatie: ValidationResult[];
}

export function BandEditor({ versie, validatie }: Props) {
  const [activeBand, setActiveBand] = useState<string>(BANDS[0].code);
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState("");
  const isConcept = versie.status === "CONCEPT";
  const isActief = versie.status === "ACTIEF";

  const activeGroep = versie.groepen.find((g) => g.band === activeBand);
  const bandMeta = BANDS.find((b) => b.code === activeBand);

  const errors = validatie.filter((v) => v.severity === "ERROR");
  const warnings = validatie.filter((v) => v.severity === "WARNING");

  function handlePubliceer() {
    setStatusError("");
    startTransition(async () => {
      try {
        await publiceerRaamwerk(versie.id);
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : "Publiceren mislukt");
      }
    });
  }

  function handleArchiveer() {
    setStatusError("");
    startTransition(async () => {
      try {
        await archiveerRaamwerk(versie.id);
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : "Archiveren mislukt");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConcept && (
            <Button onClick={handlePubliceer} disabled={isPending || errors.length > 0}>
              Publiceer
            </Button>
          )}
          {isActief && (
            <Button variant="secondary" onClick={handleArchiveer} disabled={isPending}>
              Archiveer
            </Button>
          )}
        </div>
        {statusError && <p className="text-sm text-red-600">{statusError}</p>}
      </div>

      {/* Validatieresultaten */}
      {validatie.length > 0 && (
        <div className="space-y-2">
          {errors.map((v, i) => (
            <div
              key={`e-${i}`}
              className="flex items-start gap-2 rounded-lg bg-red-900/20 px-3 py-2 text-sm text-red-400"
            >
              <span className="font-semibold">FOUT</span>
              <span>{v.bericht}</span>
            </div>
          ))}
          {warnings.map((v, i) => (
            <div
              key={`w-${i}`}
              className="flex items-start gap-2 rounded-lg bg-yellow-900/20 px-3 py-2 text-sm text-yellow-400"
            >
              <span className="font-semibold">LET OP</span>
              <span>{v.bericht}</span>
            </div>
          ))}
        </div>
      )}

      {/* Band tabs */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ backgroundColor: "var(--surface-sunken)" }}
      >
        {BANDS.map((band) => {
          const groep = versie.groepen.find((g) => g.band === band.code);
          const itemCount = groep ? groep.pijlers.reduce((s, p) => s + p.items.length, 0) : 0;
          const isActive = activeBand === band.code;

          return (
            <button
              key={band.code}
              onClick={() => setActiveBand(band.code)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? `${band.kleur} ring-2 ${band.ring} shadow-sm`
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              }`}
            >
              {band.label}
              <span className="ml-1.5 text-xs opacity-70">({itemCount})</span>
            </button>
          );
        })}
      </div>

      {/* Groep content */}
      {activeGroep ? (
        <GroepPanel groep={activeGroep} isConcept={isConcept} />
      ) : (
        <Card>
          <CardBody>
            <p className="text-text-muted text-center">
              Geen groep gevonden voor band {bandMeta?.label ?? activeBand}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ── Groep panel ───────────────────────────────────────────────

function GroepPanel({
  groep,
  isConcept,
}: {
  groep: RaamwerkDetail["groepen"][number];
  isConcept: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const totaalItems = groep.pijlers.reduce((s, p) => s + p.items.length, 0);
  const actieveItems = groep.pijlers.reduce(
    (s, p) => s + p.items.filter((i) => i.actief).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatMini label="Totaal items" value={totaalItems} />
        <StatMini label="Actief" value={actieveItems} />
        <StatMini label="Doel" value={groep.doelAantal} />
        <StatMini label="Schaal" value={SCHAAL_LABELS[groep.schaalType] ?? groep.schaalType} />
      </div>

      {/* Groepsinstellingen (alleen concept) */}
      {isConcept && (
        <GroepSettings
          groepId={groep.id}
          schaalType={groep.schaalType}
          maxScore={groep.maxScore}
          doelAantal={groep.doelAantal}
        />
      )}

      {/* Pijlers als accordions */}
      {groep.pijlers.map((pijler) => (
        <PijlerAccordion
          key={pijler.id}
          pijler={pijler}
          isConcept={isConcept}
          isPending={isPending}
          startTransition={startTransition}
        />
      ))}
    </div>
  );
}

// ── Stat mini ─────────────────────────────────────────────────

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
    >
      <p className="text-text-muted text-xs font-medium">{label}</p>
      <p className="text-text-primary mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

// ── Groep settings ────────────────────────────────────────────

function GroepSettings({
  groepId,
  schaalType: initialSchaal,
  maxScore: initialMax,
  doelAantal: initialDoel,
}: {
  groepId: string;
  schaalType: string;
  maxScore: number;
  doelAantal: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(field: string, value: string | number) {
    startTransition(async () => {
      await updateGroepSettings(groepId, { [field]: value });
    });
  }

  return (
    <details
      className="rounded-lg border"
      style={{ backgroundColor: "var(--surface-sunken)", borderColor: "var(--border-default)" }}
    >
      <summary className="text-text-secondary cursor-pointer px-4 py-2 text-sm font-medium">
        Groepsinstellingen
      </summary>
      <div className="flex flex-wrap gap-4 px-4 pt-2 pb-4">
        <div className="w-40">
          <label className="text-text-muted mb-1 block text-xs font-medium">Schaaltype</label>
          <select
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            defaultValue={initialSchaal}
            disabled={isPending}
            onChange={(e) => handleChange("schaalType", e.target.value)}
          >
            <option value="duim">Duim</option>
            <option value="smiley">Smiley</option>
            <option value="sterren">Sterren</option>
            <option value="slider">Slider</option>
          </select>
        </div>
        <div className="w-28">
          <label className="text-text-muted mb-1 block text-xs font-medium">Max score</label>
          <input
            type="number"
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            defaultValue={initialMax}
            min={1}
            max={99}
            disabled={isPending}
            onBlur={(e) => handleChange("maxScore", parseInt(e.target.value, 10))}
          />
        </div>
        <div className="w-28">
          <label className="text-text-muted mb-1 block text-xs font-medium">Doel aantal</label>
          <input
            type="number"
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            defaultValue={initialDoel}
            min={0}
            disabled={isPending}
            onBlur={(e) => handleChange("doelAantal", parseInt(e.target.value, 10))}
          />
        </div>
      </div>
    </details>
  );
}

// ── Pijler accordion ──────────────────────────────────────────

function PijlerAccordion({
  pijler,
  isConcept,
  isPending: _parentPending,
  startTransition: _parentTransition,
}: {
  pijler: RaamwerkDetail["groepen"][number]["pijlers"][number];
  isConcept: boolean;
  isPending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const [nieuwItemOpen, setNieuwItemOpen] = useState(false);
  const PijlerIcon = PIJLER_ICON_MAP[pijler.code];
  const actieveCount = pijler.items.filter((i) => i.actief).length;

  return (
    <details
      className="group rounded-lg border"
      style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
      open
    >
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {PijlerIcon ? <PijlerIcon className="h-5 w-5" /> : null}
          <span className="text-text-primary font-semibold">{pijler.naam}</span>
          <span className="text-text-muted text-sm">({pijler.code})</span>
          <Badge color="gray">{actieveCount} actief</Badge>
        </div>
        {isConcept && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setNieuwItemOpen(true);
            }}
          >
            + Item
          </Button>
        )}
      </summary>

      <div className="border-t px-4 py-2" style={{ borderColor: "var(--border-light)" }}>
        {pijler.items.length === 0 ? (
          <p className="text-text-muted py-4 text-center text-sm">Geen items</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
            {pijler.items.map((item) => (
              <ItemRij key={item.id} item={item} isConcept={isConcept} />
            ))}
          </div>
        )}
      </div>

      {nieuwItemOpen && (
        <NieuwItemDialoog
          pijlerId={pijler.id}
          pijlerCode={pijler.code}
          open={nieuwItemOpen}
          onClose={() => setNieuwItemOpen(false)}
        />
      )}
    </details>
  );
}

// ── Item rij ──────────────────────────────────────────────────

function ItemRij({ item, isConcept }: { item: RaamwerkItemDetail; isConcept: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(item.label);
  const [vraagTekst, setVraagTekst] = useState(item.vraagTekst);

  const laagInfo = item.laag ? LAAG_LABELS[item.laag] : null;

  function handleSave() {
    startTransition(async () => {
      await updateItem(item.id, { label, vraagTekst });
      setIsEditing(false);
    });
  }

  function handleToggleActief() {
    startTransition(async () => {
      await updateItem(item.id, { actief: !item.actief });
    });
  }

  function handleDelete() {
    if (!confirm(`Item "${item.label}" verwijderen?`)) return;
    startTransition(async () => {
      await deleteItem(item.id);
    });
  }

  if (isEditing && isConcept) {
    return (
      <div className="space-y-2 py-3">
        <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input
          label="Vraagtekst"
          value={vraagTekst}
          onChange={(e) => setVraagTekst(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Opslaan..." : "Opslaan"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsEditing(false);
              setLabel(item.label);
              setVraagTekst(item.vraagTekst);
            }}
          >
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 py-2.5 ${!item.actief ? "opacity-50" : ""}`}>
      {/* Actief toggle */}
      {isConcept && (
        <button
          onClick={handleToggleActief}
          disabled={isPending}
          className={`h-5 w-5 flex-shrink-0 rounded border-2 transition-colors ${
            item.actief
              ? "border-green-500 bg-green-500 text-white"
              : "border-border-default bg-surface-card"
          }`}
          title={item.actief ? "Deactiveer" : "Activeer"}
        >
          {item.actief && (
            <svg className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}

      {/* Item content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-medium">{item.label}</span>
          <span className="text-text-muted text-xs">{item.itemCode}</span>
          {laagInfo && <Badge color={laagInfo.color}>{laagInfo.label}</Badge>}
        </div>
        <p className="text-text-muted truncate text-sm">{item.vraagTekst}</p>
      </div>

      {/* Acties */}
      {isConcept && (
        <div className="flex flex-shrink-0 gap-1">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Bewerk
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
            <span className="text-red-500">Verwijder</span>
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Nieuw item dialoog ────────────────────────────────────────

function NieuwItemDialoog({
  pijlerId,
  pijlerCode,
  open,
  onClose,
}: {
  pijlerId: string;
  pijlerCode: string;
  open: boolean;
  onClose: () => void;
}) {
  const [itemCode, setItemCode] = useState(`${pijlerCode.toLowerCase()}_`);
  const [label, setLabel] = useState("");
  const [vraagTekst, setVraagTekst] = useState("");
  const [laag, setLaag] = useState<string>("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    if (!itemCode || !label || !vraagTekst) {
      setError("Alle velden zijn verplicht");
      return;
    }

    startTransition(async () => {
      try {
        await createItem(pijlerId, {
          itemCode,
          label,
          vraagTekst,
          laag: laag || null,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Aanmaken mislukt");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nieuw item"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Toevoegen..." : "Toevoegen"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Item code"
          placeholder="sch_t_afstandsschot"
          value={itemCode}
          onChange={(e) => setItemCode(e.target.value.toLowerCase())}
        />
        <Input
          label="Label"
          placeholder="Afstandsschot"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          label="Vraagtekst"
          placeholder="Hoe goed schiet de speler vanaf afstand?"
          value={vraagTekst}
          onChange={(e) => setVraagTekst(e.target.value)}
        />
        <div>
          <label className="text-text-secondary mb-1 block text-sm font-medium">
            Laag (optioneel)
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            value={laag}
            onChange={(e) => setLaag(e.target.value)}
          >
            <option value="">Geen laag</option>
            <option value="technisch">Technisch (T)</option>
            <option value="tactisch">Tactisch (Ta)</option>
            <option value="mentaal">Mentaal (M)</option>
          </select>
        </div>
        {error && (
          <p className="rounded-lg bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
