"use client";

import { useState, useTransition } from "react";
import { updateNotitieStatus, updateActiepuntStatus, deleteNotitie } from "@/app/notities/actions";
import type { NotitiePrioriteit, NotitieStatus } from "@oranje-wit/database";

type NotitieData = {
  id: string;
  titel: string;
  beschrijving: string;
  categorie: string;
  prioriteit: NotitiePrioriteit;
  status: NotitieStatus;
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
    toegewezenAan: { id: string; naam: string };
  }[];
};

interface NotitieKaartProps {
  notitie: NotitieData;
  onMutatie: () => void;
}

const PRIORITEIT_STIJL: Record<string, { badge: string; rand: string }> = {
  BLOCKER: { badge: "badge-red", rand: "border-l-4 border-l-red-400" },
  HOOG: { badge: "badge-orange", rand: "border-l-4 border-l-orange-400" },
  MIDDEL: { badge: "badge-gray", rand: "" },
  LAAG: { badge: "badge-gray", rand: "" },
  INFO: { badge: "badge-blue", rand: "" },
};

const CATEGORIE_LABEL: Record<string, string> = {
  STRATEGISCH: "Strategisch",
  DATA: "Data",
  REGEL: "Regel",
  TRAINER: "Trainer",
  SPELER: "Speler",
};

const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-red-400",
  IN_BESPREKING: "bg-orange-400",
  OPGELOST: "bg-green-400",
  GEACCEPTEERD_RISICO: "bg-yellow-400",
  GEARCHIVEERD: "bg-gray-300",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_BESPREKING: "In bespreking",
  OPGELOST: "Opgelost",
  GEACCEPTEERD_RISICO: "Geaccepteerd",
  GEARCHIVEERD: "Gearchiveerd",
};

export default function NotitieKaart({ notitie, onMutatie }: NotitieKaartProps) {
  const [isPending, startTransition] = useTransition();
  const [resolutieTekst, setResolutieTekst] = useState("");
  const [toonResolutie, setToonResolutie] = useState(false);
  const [toonVerwijder, setToonVerwijder] = useState(false);

  const stijl = PRIORITEIT_STIJL[notitie.prioriteit] ?? PRIORITEIT_STIJL.MIDDEL;
  const isAfgehandeld =
    notitie.status === "OPGELOST" ||
    notitie.status === "GEACCEPTEERD_RISICO" ||
    notitie.status === "GEARCHIVEERD";

  function handleStatusWijzig(status: NotitieStatus, resolutie?: string) {
    startTransition(async () => {
      await updateNotitieStatus(notitie.id, status, resolutie);
      setToonResolutie(false);
      setResolutieTekst("");
      onMutatie();
    });
  }

  function handleActiepuntToggle(actiepuntId: string, huidig: string) {
    startTransition(async () => {
      await updateActiepuntStatus(actiepuntId, huidig === "AFGEROND" ? "OPEN" : "AFGEROND");
      onMutatie();
    });
  }

  function handleVerwijder() {
    startTransition(async () => {
      await deleteNotitie(notitie.id);
      onMutatie();
    });
  }

  // Koppeling label
  const koppelingParts: string[] = [];
  if (notitie.speler)
    koppelingParts.push(`${notitie.speler.roepnaam} ${notitie.speler.achternaam}`);
  if (notitie.staf) koppelingParts.push(notitie.staf.naam);
  if (notitie.teamOwCode) koppelingParts.push(notitie.teamOwCode);
  if (notitie.scenario) koppelingParts.push(`Scenario: ${notitie.scenario.naam}`);

  return (
    <div
      className={`card ${stijl.rand} ${isAfgehandeld ? "opacity-60" : ""} ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={stijl.badge}>{notitie.prioriteit}</span>
          <span className="badge-gray">
            {CATEGORIE_LABEL[notitie.categorie] ?? notitie.categorie}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[notitie.status]}`} />
          <span className="text-xs text-gray-500">{STATUS_LABEL[notitie.status]}</span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2 px-4 pb-3">
        <p className="text-sm font-medium text-gray-900">{notitie.titel}</p>
        {notitie.beschrijving && <p className="text-sm text-gray-600">{notitie.beschrijving}</p>}

        {/* Koppeling + meta */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {koppelingParts.length > 0 && <span>{koppelingParts.join(" · ")}</span>}
          <span>door: {notitie.auteur.naam}</span>
          <span>
            {new Date(notitie.createdAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Resolutie (als opgelost) */}
        {notitie.resolutie && isAfgehandeld && (
          <div className="mt-2 rounded border-l-2 border-green-400 bg-green-50 px-3 py-2 text-sm text-green-700">
            {notitie.resolutie}
          </div>
        )}

        {/* Actiepunten */}
        {notitie.actiepunten.length > 0 && (
          <div className="mt-2 space-y-1">
            {notitie.actiepunten.map((ap) => (
              <label key={ap.id} className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={ap.status === "AFGEROND"}
                  onChange={() => handleActiepuntToggle(ap.id, ap.status)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                />
                <span className={ap.status === "AFGEROND" ? "text-gray-400 line-through" : ""}>
                  {ap.beschrijving}
                </span>
                <span className="text-xs text-gray-400">— {ap.toegewezenAan.naam}</span>
              </label>
            ))}
          </div>
        )}

        {/* Acties */}
        {!isAfgehandeld && (
          <div className="flex gap-2 pt-2">
            {notitie.status === "OPEN" && (
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
          <div className="space-y-2 pt-2">
            <textarea
              className="input"
              rows={2}
              placeholder="Oplossing / antwoord..."
              value={resolutieTekst}
              onChange={(e) => setResolutieTekst(e.target.value)}
            />
            <div className="flex gap-2">
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
          <div className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm">
            <span className="text-red-700">Weet je het zeker?</span>
            <button className="btn-danger btn-sm" onClick={handleVerwijder}>
              Ja, verwijder
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
