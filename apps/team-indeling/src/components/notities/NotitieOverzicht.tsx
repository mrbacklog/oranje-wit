"use client";

import { useState, useCallback } from "react";
import type { NotitieStatus, NotitiePrioriteit, NotitieCategorie } from "@oranje-wit/database";
import NotitieKaart from "./NotitieKaart";
import NotitieFilters from "./NotitieFilters";
import NotitieDialoog from "./NotitieDialoog";

type NotitieData = Parameters<typeof NotitieKaart>[0]["notitie"];

interface NotitieOverzichtProps {
  blauwdrukId: string;
  initialNotities: NotitieData[];
  initialStats: { open: number; blockers: number; afgerond: number };
  refreshAction: () => Promise<{
    notities: NotitieData[];
    stats: { open: number; blockers: number; afgerond: number };
  }>;
}

const PRIORITEIT_VOLGORDE: NotitiePrioriteit[] = ["BLOCKER", "HOOG", "MIDDEL", "LAAG", "INFO"];

const PRIORITEIT_LABEL: Record<string, string> = {
  BLOCKER: "Blockers",
  HOOG: "Hoog",
  MIDDEL: "Middel",
  LAAG: "Laag",
  INFO: "Info",
};

export default function NotitieOverzicht({
  blauwdrukId,
  initialNotities,
  initialStats,
  refreshAction,
}: NotitieOverzichtProps) {
  const [notities, setNotities] = useState(initialNotities);
  const [stats, setStats] = useState(initialStats);
  const [toonDialoog, setToonDialoog] = useState(false);
  const [filters, setFilters] = useState<{
    status: NotitieStatus | "";
    prioriteit: NotitiePrioriteit | "";
    categorie: NotitieCategorie | "";
  }>({ status: "", prioriteit: "", categorie: "" });

  const refresh = useCallback(async () => {
    const data = await refreshAction();
    setNotities(data.notities);
    setStats(data.stats);
  }, [refreshAction]);

  // Client-side filtering
  const gefilterd = notities.filter((n) => {
    if (filters.status && n.status !== filters.status) return false;
    if (filters.prioriteit && n.prioriteit !== filters.prioriteit) return false;
    if (filters.categorie && n.categorie !== filters.categorie) return false;
    return true;
  });

  // Groepeer op prioriteit
  const groepen = PRIORITEIT_VOLGORDE.map((p) => ({
    prioriteit: p,
    label: PRIORITEIT_LABEL[p],
    items: gefilterd.filter((n) => n.prioriteit === p),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notities & Acties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vragen, opmerkingen en actiepunten voor dit seizoen
          </p>
        </div>
        <button className="btn-primary" onClick={() => setToonDialoog(true)}>
          + Nieuwe notitie
        </button>
      </div>

      {/* Filters */}
      <NotitieFilters filters={filters} onChange={setFilters} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.blockers > 0 ? "text-red-600" : ""}`}>
            {stats.blockers}
          </div>
          <div className="stat-label">Blockers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.afgerond}</div>
          <div className="stat-label">Afgerond</div>
        </div>
      </div>

      {/* Notities gegroepeerd op prioriteit */}
      {groepen.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          Geen notities gevonden
        </div>
      ) : (
        groepen.map((groep) => (
          <div key={groep.prioriteit}>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              {groep.label} ({groep.items.length})
            </h2>
            <div className="space-y-2">
              {groep.items.map((notitie) => (
                <NotitieKaart key={notitie.id} notitie={notitie} onMutatie={refresh} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Dialoog */}
      {toonDialoog && (
        <NotitieDialoog
          blauwdrukId={blauwdrukId}
          onClose={() => setToonDialoog(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}
