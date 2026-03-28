"use client";

import { useState, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import type { SpelerStatus } from "@oranje-wit/database";
import Spinner from "@/components/teamindeling/ui/Spinner";
import ActivityTimeline from "@/components/teamindeling/timeline/ActivityTimeline";
import ActiviteitForm from "@/components/teamindeling/timeline/ActiviteitForm";
import {
  getTimelineVoorSubject,
  createStatusWerkitem,
  updateActiepuntStatus,
  getUsers,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import type { WerkitemData } from "@/components/teamindeling/werkbord/WerkitemKaart";
import { updateSpelerStatus } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

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
  blauwdrukId: string;
  initialStatus: string;
  notitie?: string | null;
}

export default function SpelerStatusTab({
  spelerId,
  blauwdrukId,
  initialStatus,
  notitie,
}: SpelerStatusTabProps) {
  const [werkitems, setWerkitems] = useState<WerkitemData[]>([]);
  const [users, setUsers] = useState<{ id: string; naam: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [spelerStatus, setSpelerStatus] = useState(initialStatus);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getTimelineVoorSubject({ spelerId }), getUsers()])
      .then(([items, usrs]) => {
        if (cancelled) return;
        setWerkitems(items as WerkitemData[]);
        setUsers(usrs);
      })
      .catch((err) => {
        logger.warn("Timeline/users ophalen mislukt:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spelerId]);

  const refreshTimeline = async () => {
    const items = await getTimelineVoorSubject({ spelerId });
    setWerkitems(items as WerkitemData[]);
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
            await createStatusWerkitem(spelerId, oud, nieuw);
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

      {/* Werkitem form + timeline */}
      <ActiviteitForm
        spelerId={spelerId}
        blauwdrukId={blauwdrukId}
        users={users}
        onCreated={refreshTimeline}
      />
      <ActivityTimeline
        werkitems={werkitems}
        onToggleActiepunt={async (id) => {
          await updateActiepuntStatus(id, "AFGEROND");
          await refreshTimeline();
        }}
      />

      {/* Vrije notitie */}
      {notitie && (
        <div className="mt-4">
          <span className="mb-1 block text-xs text-gray-500">Notitie</span>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{notitie}</p>
        </div>
      )}
    </>
  );
}
