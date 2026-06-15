"use client";

import { useState, useTransition, useEffect, useLayoutEffect, useRef } from "react";
import {
  voegStafAanDoelToe,
  verwijderStafUitDoel,
  updateStafRolOpDoel,
} from "@/app/(protected)/personen/staf-actions";
import {
  type StafKoppelStaf,
  type StafKoppelDoel,
  type StafKoppelingView,
  ROL_SUGGESTIES,
  KLEUR_DOT,
  toonRol,
} from "./staf-koppel-types";

interface Props {
  staf: StafKoppelStaf;
  alleDoelen: StafKoppelDoel[];
  onClose: () => void;
  /**
   * Aangeroepen na elke geslaagde mutatie met de bijgewerkte koppelingen.
   * Hosts gebruiken dit voor optimistische updates (kaart-footer, badges).
   */
  onGewijzigd?: (nieuweTeams: StafKoppelingView[]) => void;
}

export function StafKoppelEditor({ staf, alleDoelen, onClose, onGewijzigd }: Props) {
  const [isPending, startTransition] = useTransition();
  const [nieuwDoelId, setNieuwDoelId] = useState<string>("");
  const [nieuwRol, setNieuwRol] = useState<string>("Trainer/Coach");
  const [nieuwRolLabel, setNieuwRolLabel] = useState<string>("");
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lokale kopie voor optimistische weergave; herseed bij verse props (server-refresh).
  const [lokaleTeams, setLokaleTeams] = useState<StafKoppelingView[]>(staf.teams);
  useEffect(() => {
    setLokaleTeams(staf.teams);
  }, [staf.teams]);

  function commit(nieuw: StafKoppelingView[]) {
    setLokaleTeams(nieuw);
    onGewijzigd?.(nieuw);
  }

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [onClose]);

  // Klap omhoog als de popover onderaan buiten beeld zou vallen.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) setOpenUp(true);
  }, [lokaleTeams.length]);

  const huidigeIds = new Set(lokaleTeams.map((t) => t.teamId));
  const beschikbareDoelen = alleDoelen.filter((d) => !huidigeIds.has(d.id));
  const losseTeams = beschikbareDoelen.filter((d) => d.type === "team");
  const selecties = beschikbareDoelen.filter((d) => d.type === "selectie");

  function handleVoegToe() {
    const rol = nieuwRol.trim();
    const doel = alleDoelen.find((o) => o.id === nieuwDoelId);
    if (!doel || !rol) return;
    startTransition(async () => {
      const res = await voegStafAanDoelToe(
        staf.id,
        { id: doel.id, type: doel.type },
        rol,
        nieuwRolLabel.trim() || undefined
      );
      if (!res.ok) return;
      commit([
        ...lokaleTeams,
        {
          teamId: doel.id,
          teamNaam: doel.naam,
          kleur: doel.kleur,
          rol,
          rolLabel: nieuwRolLabel.trim() || null,
          doelType: doel.type,
        },
      ]);
      setNieuwDoelId("");
      setNieuwRol("Trainer");
      setNieuwRolLabel("");
    });
  }

  function handleVerwijder(koppeling: StafKoppelingView) {
    startTransition(async () => {
      const res = await verwijderStafUitDoel(staf.id, {
        id: koppeling.teamId,
        type: koppeling.doelType,
      });
      if (!res.ok) return;
      commit(lokaleTeams.filter((t) => t.teamId !== koppeling.teamId));
    });
  }

  function handleRolLabelWijzig(koppeling: StafKoppelingView, rolLabel: string) {
    const schoon = rolLabel.trim();
    if (schoon === (koppeling.rolLabel ?? "")) return;
    startTransition(async () => {
      const res = await updateStafRolOpDoel(
        staf.id,
        { id: koppeling.teamId, type: koppeling.doelType },
        koppeling.rol,
        schoon || undefined
      );
      if (!res.ok) return;
      commit(
        lokaleTeams.map((t) =>
          t.teamId === koppeling.teamId ? { ...t, rolLabel: schoon || null } : t
        )
      );
    });
  }

  function handleRolWijzig(koppeling: StafKoppelingView, rol: string) {
    const schoon = rol.trim();
    if (!schoon || schoon === koppeling.rol) return;
    startTransition(async () => {
      const res = await updateStafRolOpDoel(
        staf.id,
        { id: koppeling.teamId, type: koppeling.doelType },
        schoon
      );
      if (!res.ok) return;
      commit(lokaleTeams.map((t) => (t.teamId === koppeling.teamId ? { ...t, rol: schoon } : t)));
    });
  }

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        ...(openUp ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }),
        left: 0,
        zIndex: 50,
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: 8,
        padding: "0.75rem",
        minWidth: 340,
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
        Teams &amp; selecties + rollen voor {staf.naam}
      </div>
      {lokaleTeams.length === 0 && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
          Nog geen koppelingen
        </div>
      )}
      {lokaleTeams.map((t) => {
        const isSelectie = t.doelType === "selectie";
        return (
          <div key={t.teamId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.8125rem",
                color: "var(--text-primary)",
                fontWeight: 500,
                minWidth: 110,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: KLEUR_DOT[t.kleur ?? ""] ?? "#94a3b8",
                  flexShrink: 0,
                }}
              />
              {t.teamNaam}
              {isSelectie && (
                <span
                  style={{
                    fontSize: "0.55rem",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 3,
                    background: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                    fontWeight: 700,
                  }}
                >
                  SEL
                </span>
              )}
            </span>
            <input
              type="text"
              defaultValue={t.rol.trim().toLowerCase() === "trainer" ? "Trainer/Coach" : t.rol}
              disabled={isPending}
              onBlur={(e) => handleRolWijzig(t, e.target.value)}
              list={`rol-suggesties-${staf.id}`}
              style={{
                flex: 1,
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                padding: "0.25rem 0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.75rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input
              type="text"
              defaultValue={t.rolLabel ?? ""}
              disabled={isPending}
              onBlur={(e) => handleRolLabelWijzig(t, e.target.value)}
              placeholder="Functietitel (opt.)"
              style={{
                flex: "0.8",
                width: 130,
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                padding: "0.25rem 0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.75rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={() => handleVerwijder(t)}
              disabled={isPending}
              aria-label={`Verwijder ${staf.naam} uit ${t.teamNaam}`}
              title="Verwijder koppeling"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 5,
                border: "1px solid var(--border-default)",
                background: "var(--surface-sunken)",
                color: "var(--text-secondary)",
                cursor: isPending ? "not-allowed" : "pointer",
                fontSize: "0.75rem",
                padding: 0,
                lineHeight: 1,
                fontFamily: "inherit",
                transition: "background 120ms, color 120ms, border-color 120ms",
              }}
              onMouseEnter={(e) => {
                if (isPending) return;
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(239,68,68,0.15)";
                b.style.borderColor = "rgba(239,68,68,0.35)";
                b.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "var(--surface-sunken)";
                b.style.borderColor = "var(--border-default)";
                b.style.color = "var(--text-secondary)";
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <datalist id={`rol-suggesties-${staf.id}`}>
        {ROL_SUGGESTIES.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <div
        style={{
          borderTop: "1px solid var(--border-default)",
          paddingTop: "0.5rem",
          marginTop: "0.25rem",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 5,
            border: "1px dashed var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          +
        </div>
        <select
          value={nieuwDoelId}
          onChange={(e) => setNieuwDoelId(e.target.value)}
          disabled={isPending || beschikbareDoelen.length === 0}
          style={{
            flex: 1,
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            padding: "0.25rem 0.5rem",
            color: "var(--text-primary)",
            fontSize: "0.75rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        >
          <option value="">Kies team of selectie…</option>
          {losseTeams.length > 0 && (
            <optgroup label="Teams">
              {losseTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.naam}
                </option>
              ))}
            </optgroup>
          )}
          {selecties.length > 0 && (
            <optgroup label="Selecties (gecombineerd)">
              {selecties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.naam}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="text"
          value={nieuwRol}
          onChange={(e) => setNieuwRol(e.target.value)}
          disabled={isPending}
          list={`rol-suggesties-${staf.id}`}
          placeholder="Rol"
          style={{
            width: 110,
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            padding: "0.25rem 0.5rem",
            color: "var(--text-primary)",
            fontSize: "0.75rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <input
          type="text"
          value={nieuwRolLabel}
          onChange={(e) => setNieuwRolLabel(e.target.value)}
          disabled={isPending}
          placeholder="Functietitel (opt.)"
          style={{
            width: 130,
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            padding: "0.25rem 0.5rem",
            color: "var(--text-primary)",
            fontSize: "0.75rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={handleVoegToe}
          disabled={isPending || !nieuwDoelId || !nieuwRol.trim()}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: isPending || !nieuwDoelId ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: isPending || !nieuwDoelId || !nieuwRol.trim() ? 0.6 : 1,
          }}
        >
          Voeg toe
        </button>
      </div>
    </div>
  );
}
