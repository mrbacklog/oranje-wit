"use client";

import { useState, useEffect } from "react";
import type { SpelerStatus } from "@oranje-wit/database";
import Spinner from "@/components/ui/Spinner";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import ActiviteitForm from "@/components/timeline/ActiviteitForm";
import {
  getSpelerActiviteiten,
  getUsers,
  toggleActiepuntStatus,
  createStatusWijziging,
} from "@/app/activiteiten/actions";
import type { ActiviteitMetRelaties } from "@/app/activiteiten/actions";
import { updateSpelerStatus } from "@/app/blauwdruk/actions";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw (potentieel)",
  NIEUW_DEFINITIEF: "Nieuw (definitief)",
  ALGEMEEN_RESERVE: "Algemeen reserve",
};

interface SpelerStatusTabProps {
  spelerId: string;
  initialStatus: string;
  notitie?: string | null;
}

export default function SpelerStatusTab({
  spelerId,
  initialStatus,
  notitie,
}: SpelerStatusTabProps) {
  const [activiteiten, setActiviteiten] = useState<ActiviteitMetRelaties[]>([]);
  const [users, setUsers] = useState<{ id: string; naam: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [spelerStatus, setSpelerStatus] = useState(initialStatus);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getSpelerActiviteiten(spelerId), getUsers()])
      .then(([acts, usrs]) => {
        if (cancelled) return;
        setActiviteiten(acts);
        setUsers(usrs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spelerId]);

  const refreshTimeline = async () => {
    const acts = await getSpelerActiviteiten(spelerId);
    setActiviteiten(acts);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Spinner size="sm" className="text-orange-500" />
        <span className="text-xs text-gray-400">Laden...</span>
      </div>
    );
  }

  return (
    <>
      {/* Status dropdown */}
      <div>
        <span className="mb-1 block text-xs text-gray-500">Status</span>
        <select
          value={spelerStatus}
          onChange={async (e) => {
            const oud = spelerStatus;
            const nieuw = e.target.value;
            setSpelerStatus(nieuw as SpelerStatus);
            await updateSpelerStatus(spelerId, nieuw as SpelerStatus);
            await createStatusWijziging(spelerId, oud, nieuw);
            await refreshTimeline();
          }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Activiteit form + timeline */}
      <ActiviteitForm spelerId={spelerId} users={users} onCreated={refreshTimeline} />
      <ActivityTimeline
        activiteiten={activiteiten}
        onToggleActiepunt={async (id) => {
          await toggleActiepuntStatus(id);
          await refreshTimeline();
        }}
      />

      {/* Vrije notitie (als die bestaat) */}
      {notitie && (
        <div className="mt-4">
          <span className="mb-1 block text-xs text-gray-500">Notitie</span>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{notitie}</p>
        </div>
      )}
    </>
  );
}
