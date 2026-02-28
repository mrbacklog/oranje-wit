"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import type { SpelerStatus } from "@oranje-wit/database";
import type { SpelerUitgebreid } from "@/app/blauwdruk/actions";
import { updateSpelerStatus } from "@/app/blauwdruk/actions";
import SpelerAvatar from "@/components/ui/SpelerAvatar";
import SpelerStatusBadge from "./SpelerStatusBadge";

const STATUS_OPTIES: { waarde: SpelerStatus; label: string }[] = [
  { waarde: "BESCHIKBAAR", label: "Beschikbaar" },
  { waarde: "TWIJFELT", label: "Twijfelt" },
  { waarde: "GAAT_STOPPEN", label: "Gaat stoppen" },
  { waarde: "NIEUW_POTENTIEEL", label: "Nieuw (potentieel)" },
  { waarde: "NIEUW_DEFINITIEF", label: "Nieuw (definitief)" },
];

type StatusFilter = SpelerStatus | "ALLE";
type KleurFilter = string | "ALLE";
type SortKey =
  | "naam"
  | "leeftijd"
  | "geslacht"
  | "team"
  | "categorie"
  | "retentie"
  | "seizoenen"
  | "status";
type SortDir = "asc" | "desc";

const RETENTIE_VOLGORDE: Record<string, number> = {
  hoog: 3,
  gemiddeld: 2,
  laag: 1,
};

interface LedenDashboardProps {
  spelers: SpelerUitgebreid[];
}

export default function LedenDashboard({ spelers: initieleSpelers }: LedenDashboardProps) {
  const [spelers, setSpelers] = useState(initieleSpelers);
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALLE");
  const [kleurFilter, setKleurFilter] = useState<KleurFilter>("ALLE");
  const [sortKey, setSortKey] = useState<SortKey>("naam");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isPending, startTransition] = useTransition();

  // Samenvatting
  const samenvatting = useMemo(() => {
    const telling = {
      BESCHIKBAAR: 0,
      TWIJFELT: 0,
      GAAT_STOPPEN: 0,
      NIEUW_POTENTIEEL: 0,
      NIEUW_DEFINITIEF: 0,
    };
    for (const s of spelers) {
      if (s.status in telling) telling[s.status as keyof typeof telling]++;
    }
    return telling;
  }, [spelers]);

  // Unieke kleuren
  const uniekeKleuren = useMemo(() => {
    const set = new Set<string>();
    for (const s of spelers) {
      const k = s.huidig?.kleur;
      if (k) set.add(k);
    }
    return Array.from(set).sort();
  }, [spelers]);

  // Filteren en sorteren
  const gefilterd = useMemo(() => {
    let res = spelers;

    if (zoekterm) {
      const term = zoekterm.toLowerCase();
      res = res.filter(
        (s) => s.roepnaam.toLowerCase().includes(term) || s.achternaam.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "ALLE") {
      res = res.filter((s) => s.status === statusFilter);
    }
    if (kleurFilter !== "ALLE") {
      res = res.filter((s) => s.huidig?.kleur === kleurFilter);
    }

    const richting = sortDir === "asc" ? 1 : -1;
    res = [...res].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "naam":
          cmp = `${a.achternaam} ${a.roepnaam}`.localeCompare(`${b.achternaam} ${b.roepnaam}`);
          break;
        case "leeftijd":
          cmp = a.leeftijdVolgendSeizoen - b.leeftijdVolgendSeizoen;
          break;
        case "geslacht":
          cmp = a.geslacht.localeCompare(b.geslacht);
          break;
        case "team":
          cmp = (a.huidig?.team ?? "").localeCompare(b.huidig?.team ?? "");
          break;
        case "categorie":
          cmp = (a.volgendSeizoen?.a_categorie ?? a.volgendSeizoen?.band_b ?? "").localeCompare(
            b.volgendSeizoen?.a_categorie ?? b.volgendSeizoen?.band_b ?? ""
          );
          break;
        case "retentie":
          cmp =
            (RETENTIE_VOLGORDE[a.retentie?.risico ?? ""] ?? 0) -
            (RETENTIE_VOLGORDE[b.retentie?.risico ?? ""] ?? 0);
          break;
        case "seizoenen":
          cmp = (a.seizoenenActief ?? 0) - (b.seizoenenActief ?? 0);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return cmp * richting;
    });

    return res;
  }, [spelers, zoekterm, statusFilter, kleurFilter, sortKey, sortDir]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const wijzigStatus = useCallback((spelerId: string, nieuweStatus: SpelerStatus) => {
    setSpelers((prev) => prev.map((s) => (s.id === spelerId ? { ...s, status: nieuweStatus } : s)));
    startTransition(async () => {
      await updateSpelerStatus(spelerId, nieuweStatus);
    });
  }, []);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  };

  const retentieDot = (risico?: string) => {
    const r = risico?.toLowerCase();
    if (r === "hoog") return "bg-red-500";
    if (r === "gemiddeld") return "bg-orange-500";
    if (r === "laag") return "bg-green-500";
    return "bg-gray-300";
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="stat-card">
          <span className="stat-value">{spelers.length}</span>
          <span className="stat-label">Totaal leden</span>
        </div>
        <div className="stat-card border-l-4 border-l-green-500">
          <span className="stat-value">{samenvatting.BESCHIKBAAR}</span>
          <span className="stat-label">Beschikbaar</span>
        </div>
        <div className="stat-card border-l-4 border-l-orange-500">
          <span className="stat-value">{samenvatting.TWIJFELT}</span>
          <span className="stat-label">Twijfelt</span>
        </div>
        <div className="stat-card border-l-4 border-l-red-500">
          <span className="stat-value">{samenvatting.GAAT_STOPPEN}</span>
          <span className="stat-label">Gaat stoppen</span>
        </div>
        <div className="stat-card border-l-4 border-l-blue-400">
          <span className="stat-value">{samenvatting.NIEUW_POTENTIEEL}</span>
          <span className="stat-label">Potentieel</span>
        </div>
        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="stat-value">{samenvatting.NIEUW_DEFINITIEF}</span>
          <span className="stat-label">Definitief</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoek op naam..."
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
        >
          <option value="ALLE">Alle statussen</option>
          {STATUS_OPTIES.map((o) => (
            <option key={o.waarde} value={o.waarde}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={kleurFilter}
          onChange={(e) => setKleurFilter(e.target.value as KleurFilter)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
        >
          <option value="ALLE">Alle kleuren</option>
          {uniekeKleuren.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="w-10 px-3 py-2 font-medium"></th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("naam")}
                >
                  Naam{sortIndicator("naam")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("leeftijd")}
                >
                  Leeftijd{sortIndicator("leeftijd")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("geslacht")}
                >
                  M/V{sortIndicator("geslacht")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("team")}
                >
                  Huidig team{sortIndicator("team")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("categorie")}
                >
                  Verwachte cat.{sortIndicator("categorie")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("retentie")}
                >
                  Retentie{sortIndicator("retentie")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("seizoenen")}
                >
                  Seizoenen{sortIndicator("seizoenen")}
                </th>
                <th
                  className="cursor-pointer px-3 py-2 font-medium select-none hover:text-gray-700"
                  onClick={() => toggleSort("status")}
                >
                  Status{sortIndicator("status")}
                </th>
                <th className="px-3 py-2 font-medium">Wijzig</th>
              </tr>
            </thead>
            <tbody>
              {gefilterd.map((speler) => (
                <tr key={speler.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="sm" />
                  </td>
                  <td className="px-3 py-2 text-gray-800">
                    {speler.roepnaam} {speler.achternaam}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{speler.leeftijdVolgendSeizoen}</td>
                  <td className="px-3 py-2 text-gray-600">{speler.geslacht}</td>
                  <td className="px-3 py-2 text-gray-600">{speler.huidig?.team ?? "\u2014"}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {speler.volgendSeizoen?.a_categorie ??
                      speler.volgendSeizoen?.band_b ??
                      "\u2014"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${retentieDot(speler.retentie?.risico)}`}
                      />
                      {speler.retentie?.risico ?? "\u2014"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{speler.seizoenenActief ?? "\u2014"}</td>
                  <td className="px-3 py-2">
                    <SpelerStatusBadge status={speler.status} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={speler.status}
                      onChange={(e) => wijzigStatus(speler.id, e.target.value as SpelerStatus)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
                    >
                      {STATUS_OPTIES.map((o) => (
                        <option key={o.waarde} value={o.waarde}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {gefilterd.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-400 italic">
                    Geen spelers gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          {gefilterd.length} van {spelers.length} spelers getoond
        </p>
        {isPending && <p className="text-xs text-gray-400">Opslaan...</p>}
      </div>
    </div>
  );
}
