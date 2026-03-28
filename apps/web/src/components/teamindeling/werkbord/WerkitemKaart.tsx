"use client";

import { useState, useTransition } from "react";
import {
  updateWerkitemStatus,
  updateActiepuntStatus,
  deleteWerkitem,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import type { WerkitemPrioriteit, WerkitemStatus } from "./types";

export type WerkitemData = {
  id: string;
  titel: string;
  beschrijving: string;
  type: string;
  prioriteit: WerkitemPrioriteit;
  status: WerkitemStatus;
  besluitniveau: string | null;
  doelgroep: string | null;
  entiteit: string | null;
  teamOwCode: string | null;
  resolutie: string | null;
  opgelostOp: Date | null;
  createdAt: Date;
  auteur: { id: string; naam: string };
  speler: { id: string; roepnaam: string; achternaam: string } | null;
  staf: { id: string; naam: string } | null;
  scenario: { id: string; naam: string } | null;
  actiepunten: {
    id: string;
    beschrijving: string;
    status: string;
    deadline: Date | null;
    volgorde: number;
    toegewezenAan: { id: string; naam: string } | null;
  }[];
};

interface WerkitemKaartProps {
  werkitem: WerkitemData;
  onMutatie?: () => void;
  compact?: boolean;
}

const PRIORITEIT_STIJL: Record<string, { badge: string; rand: string }> = {
  BLOCKER: { badge: "badge-red", rand: "border-l-4 border-l-red-400" },
  HOOG: { badge: "badge-orange", rand: "border-l-4 border-l-orange-400" },
  MIDDEL: { badge: "badge-gray", rand: "" },
  LAAG: { badge: "badge-gray", rand: "" },
  INFO: { badge: "badge-blue", rand: "" },
};

const TYPE_LABEL: Record<string, string> = {
  STRATEGISCH: "Strategisch",
  DATA: "Data",
  REGEL: "Regel",
  TRAINER: "Trainer",
  SPELER: "Speler",
  BESLUIT: "Besluit",
};

const BESLUITNIVEAU_LABEL: Record<string, string> = {
  BESTUUR: "Bestuur",
  TC: "TC",
  DOELGROEP: "Doelgroep",
};

const DOELGROEP_LABEL: Record<string, string> = {
  TOP: "Top",
  KWEEK: "Kweek",
  OPLEIDINGSHART: "Opleidingshart",
  KORFBALPLEZIER_JEUGD: "KP Jeugd",
  KORFBALPLEZIER_SENIOREN: "KP Senioren",
};

export default function WerkitemKaart({ werkitem, onMutatie, compact }: WerkitemKaartProps) {
  const [isPending, startTransition] = useTransition();
  const [resolutieTekst, setResolutieTekst] = useState("");
  const [toonResolutie, setToonResolutie] = useState(false);
  const [toonVerwijder, setToonVerwijder] = useState(false);

  const stijl = PRIORITEIT_STIJL[werkitem.prioriteit] ?? PRIORITEIT_STIJL.MIDDEL;
  const isAfgehandeld =
    werkitem.status === "OPGELOST" ||
    werkitem.status === "GEACCEPTEERD_RISICO" ||
    werkitem.status === "GEARCHIVEERD";

  const afgerondeActiepunten = werkitem.actiepunten.filter((a) => a.status === "AFGEROND").length;

  function handleStatusWijzig(status: WerkitemStatus, resolutie?: string) {
    startTransition(async () => {
      await updateWerkitemStatus(werkitem.id, status, resolutie);
      setToonResolutie(false);
      setResolutieTekst("");
      onMutatie?.();
    });
  }

  function handleActiepuntToggle(actiepuntId: string, huidig: string) {
    startTransition(async () => {
      await updateActiepuntStatus(actiepuntId, huidig === "AFGEROND" ? "OPEN" : "AFGEROND");
      onMutatie?.();
    });
  }

  function handleVerwijder() {
    startTransition(async () => {
      await deleteWerkitem(werkitem.id);
      onMutatie?.();
    });
  }

  // Koppeling labels
  const koppelingParts: string[] = [];
  if (werkitem.speler)
    koppelingParts.push(`${werkitem.speler.roepnaam} ${werkitem.speler.achternaam}`);
  if (werkitem.staf) koppelingParts.push(werkitem.staf.naam);
  if (werkitem.teamOwCode) koppelingParts.push(werkitem.teamOwCode);
  if (werkitem.scenario) koppelingParts.push(`Scenario: ${werkitem.scenario.naam}`);

  return (
    <div
      className={`card ${stijl.rand} ${isAfgehandeld ? "opacity-60" : ""} ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className={stijl.badge}>{werkitem.prioriteit}</span>
          <span className="badge-gray">{TYPE_LABEL[werkitem.type] ?? werkitem.type}</span>
          {werkitem.besluitniveau && (
            <span className="badge-blue">
              {BESLUITNIVEAU_LABEL[werkitem.besluitniveau]}
              {werkitem.doelgroep
                ? ` · ${DOELGROEP_LABEL[werkitem.doelgroep] ?? werkitem.doelgroep}`
                : ""}
            </span>
          )}
        </div>
        {werkitem.actiepunten.length > 0 && (
          <span className="text-xs text-gray-400">
            ✓ {afgerondeActiepunten}/{werkitem.actiepunten.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1.5 px-3 pb-2">
        <p className="text-sm font-medium text-gray-900">{werkitem.titel}</p>
        {!compact && werkitem.beschrijving && (
          <p className="line-clamp-2 text-sm text-gray-600">{werkitem.beschrijving}</p>
        )}

        {/* Koppeling + meta */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {koppelingParts.length > 0 && <span>{koppelingParts.join(" · ")}</span>}
          <span>{werkitem.auteur.naam}</span>
          <span>
            {new Date(werkitem.createdAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Resolutie */}
        {werkitem.resolutie && isAfgehandeld && (
          <div className="rounded border-l-2 border-green-400 bg-green-50 px-2 py-1 text-xs text-green-700">
            {werkitem.resolutie}
          </div>
        )}

        {/* Actiepunten */}
        {!compact && werkitem.actiepunten.length > 0 && (
          <div className="space-y-0.5">
            {werkitem.actiepunten.map((ap) => (
              <label key={ap.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={ap.status === "AFGEROND"}
                  onChange={() => handleActiepuntToggle(ap.id, ap.status)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                />
                <span className={ap.status === "AFGEROND" ? "text-gray-400 line-through" : ""}>
                  {ap.beschrijving}
                </span>
                {ap.toegewezenAan && (
                  <span className="text-gray-400">— {ap.toegewezenAan.naam}</span>
                )}
              </label>
            ))}
          </div>
        )}

        {/* Acties */}
        {!isAfgehandeld && !compact && (
          <div className="flex flex-wrap gap-1 pt-1">
            {werkitem.status === "OPEN" && (
              <button
                className="btn-ghost btn-sm"
                onClick={() => handleStatusWijzig("IN_BESPREKING")}
              >
                In bespreking
              </button>
            )}
            <button className="btn-ghost btn-sm" onClick={() => setToonResolutie(!toonResolutie)}>
              Afhandelen
            </button>
            <button
              className="btn-ghost btn-sm"
              onClick={() => handleStatusWijzig("GEACCEPTEERD_RISICO", "Risico geaccepteerd")}
            >
              Accepteer risico
            </button>
            <button
              className="btn-ghost btn-sm text-red-500 hover:text-red-700"
              onClick={() => setToonVerwijder(true)}
            >
              Verwijder
            </button>
          </div>
        )}

        {/* Resolutie invoer */}
        {toonResolutie && (
          <div className="space-y-1.5 pt-1">
            <textarea
              className="input text-sm"
              rows={2}
              placeholder="Oplossing / besluit..."
              value={resolutieTekst}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setResolutieTekst(e.target.value)
              }
            />
            <div className="flex gap-1">
              <button
                className="btn-primary btn-sm"
                disabled={!resolutieTekst.trim()}
                onClick={() => handleStatusWijzig("OPGELOST", resolutieTekst.trim())}
              >
                Opslaan
              </button>
              <button className="btn-secondary btn-sm" onClick={() => setToonResolutie(false)}>
                Annuleer
              </button>
            </div>
          </div>
        )}

        {/* Verwijder bevestiging */}
        {toonVerwijder && (
          <div className="flex items-center gap-2 rounded bg-red-50 px-2 py-1.5 text-sm">
            <span className="text-red-700">Zeker?</span>
            <button className="btn-danger btn-sm" onClick={handleVerwijder}>
              Ja
            </button>
            <button className="btn-secondary btn-sm" onClick={() => setToonVerwijder(false)}>
              Nee
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
