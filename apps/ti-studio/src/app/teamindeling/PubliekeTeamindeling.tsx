"use client";

import "./publieke-teamindeling.css";
import { useEffect, useRef, useState } from "react";
import type { PubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { NavFooter } from "./components/NavFooter";
import { TeamKaart } from "./components/TeamKaart";
import { ToelichtingPagina } from "./components/ToelichtingPagina";
import { ZoekOverlay } from "./components/ZoekOverlay";

type AnimRichting = "next" | "prev" | null;

function animKlasse(richting: AnimRichting): string {
  if (richting === "next") return "pt-slide-next";
  if (richting === "prev") return "pt-slide-prev";
  return "";
}

export function PubliekeTeamindeling({ data }: { data: PubliekeTeamindelingData }) {
  const [pagina, setPagina] = useState<"toelichting" | "indeling">("toelichting");
  const [teamIdx, setTeamIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [animRichting, setAnimRichting] = useState<AnimRichting>(null);

  // Swipe-detectie
  const touchStartX = useRef<number | null>(null);

  const teams = data.teams;
  const huidigTeam = teams[teamIdx];

  function naarTeam(idx: number, richting: AnimRichting) {
    setAnimRichting(richting);
    setTeamIdx(idx);
    if (richting !== null) {
      setTimeout(() => setAnimRichting(null), 350);
    }
  }

  function gaVorig() {
    if (teamIdx > 0) naarTeam(teamIdx - 1, "prev");
  }
  function gaVolgend() {
    if (teamIdx < teams.length - 1) naarTeam(teamIdx + 1, "next");
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
              naarTeam(idx, null);
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
      style={{ minHeight: "100vh", background: "#080808", paddingBottom: 60 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Team kaart */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {huidigTeam ? (
          <TeamKaart
            key={teamIdx}
            team={huidigTeam}
            animKlasse={animKlasse(animRichting)}
            onZoek={() => setZoekOpen(true)}
            onToelichting={() => setPagina("toelichting")}
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
        onKiesTeam={(idx) => naarTeam(idx, idx > teamIdx ? "next" : "prev")}
      />

      {/* Zoekoverlay */}
      {zoekOpen && (
        <ZoekOverlay
          teams={teams}
          onSluit={() => setZoekOpen(false)}
          onKiesTeam={(idx) => {
            naarTeam(idx, null);
            setZoekOpen(false);
          }}
        />
      )}
    </div>
  );
}
