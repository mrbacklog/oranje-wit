"use client";

import "./publieke-teamindeling.css";
import { useEffect, useRef, useState } from "react";
import type { PubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { NavFooter } from "./components/NavFooter";
import { TeamKaart } from "./components/TeamKaart";
import { ToelichtingPagina } from "./components/ToelichtingPagina";
import { ZoekOverlay } from "./components/ZoekOverlay";

export function PubliekeTeamindeling({ data }: { data: PubliekeTeamindelingData }) {
  const [pagina, setPagina] = useState<"toelichting" | "indeling">("toelichting");
  const [teamIdx, setTeamIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);

  // Swipe-detectie
  const touchStartX = useRef<number | null>(null);

  const teams = data.teams;
  const huidigTeam = teams[teamIdx];

  function naarTeam(idx: number) {
    setTeamIdx(idx);
  }

  function gaVorig() {
    if (teamIdx > 0) naarTeam(teamIdx - 1);
  }
  function gaVolgend() {
    if (teamIdx < teams.length - 1) naarTeam(teamIdx + 1);
  }

  // Keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (zoekOpen) {
        if (e.key === "Escape") setZoekOpen(false);
        return;
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setZoekOpen(true);
        return;
      }
      if (pagina !== "indeling") return;
      if (e.key === "ArrowRight") gaVolgend();
      if (e.key === "ArrowLeft") gaVorig();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pagina, teamIdx, teams.length, zoekOpen]);

  // Swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) gaVolgend();
      else gaVorig();
    }
    touchStartX.current = null;
  }

  if (pagina === "toelichting") {
    return (
      <>
        <ToelichtingPagina toelichting={data.toelichting} onGaNaar={() => setPagina("indeling")} />
        {zoekOpen && (
          <ZoekOverlay
            teams={teams}
            onSluit={() => setZoekOpen(false)}
            onKiesTeam={(idx) => {
              naarTeam(idx);
              setPagina("indeling");
            }}
          />
        )}
      </>
    );
  }

  return (
    <div
      className="pt-root"
      style={{ minHeight: "100vh", background: "#080808", paddingBottom: 90 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Team kaart */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {huidigTeam ? (
          <TeamKaart
            key={teamIdx}
            team={huidigTeam}
            animKlasse="pt-team-in"
            onZoek={() => setZoekOpen(true)}
            seizoenLabel={data.toelichting?.seizoenLabel ?? null}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            Geen teams beschikbaar
          </div>
        )}
      </div>

      {/* Footer nav */}
      <NavFooter
        teams={teams}
        teamIdx={teamIdx}
        onVorig={gaVorig}
        onVolgend={gaVolgend}
        onKiesTeam={(idx) => naarTeam(idx)}
        onToelichting={() => setPagina("toelichting")}
        onTcOproep={() => {}}
        onVragen={() => {}}
      />

      {/* Zoekoverlay */}
      {zoekOpen && (
        <ZoekOverlay
          teams={teams}
          onSluit={() => setZoekOpen(false)}
          onKiesTeam={(idx) => {
            naarTeam(idx);
            setZoekOpen(false);
          }}
        />
      )}
    </div>
  );
}
