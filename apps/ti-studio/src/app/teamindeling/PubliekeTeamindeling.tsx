"use client";

import "./publieke-teamindeling.css";
import { useEffect, useRef, useState } from "react";
import type { PubliekeTeamindelingData } from "@/lib/teamindeling/publieke-presentatie";
import { AppFooter } from "./components/AppFooter";
import type { AppPagina } from "./components/AppFooter";
import { KalenderPagina } from "./components/KalenderPagina";
import { KennismakingPagina } from "./components/KennismakingPagina";
import { TeamKaart } from "./components/TeamKaart";
import { TcOproepPagina } from "./components/TcOproepPagina";
import { ToelichtingPagina } from "./components/ToelichtingPagina";
import { VragenPagina } from "./components/VragenPagina";
import { ZoekOverlay } from "./components/ZoekOverlay";

export function PubliekeTeamindeling({ data }: { data: PubliekeTeamindelingData }) {
  const [pagina, setPagina] = useState<AppPagina>("toelichting");
  const [teamIdx, setTeamIdx] = useState(0);
  const [zoekOpen, setZoekOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);

  const teams = data.teams;
  const huidigTeam = teams[teamIdx];
  const toelichting = data.toelichting;

  function naarTeam(idx: number) {
    setTeamIdx(idx);
    window.scrollTo(0, 0);
  }

  function naarPagina(p: AppPagina) {
    setPagina(p);
    window.scrollTo(0, 0);
  }

  function gaVorig() {
    if (teamIdx > 0) naarTeam(teamIdx - 1);
  }
  function gaVolgend() {
    if (teamIdx < teams.length - 1) naarTeam(teamIdx + 1);
  }

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

  function onTouchStart(e: React.TouchEvent) {
    if (pagina !== "indeling") return;
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (pagina !== "indeling") return;
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) gaVolgend();
      else gaVorig();
    }
    touchStartX.current = null;
  }

  function renderPagina() {
    switch (pagina) {
      case "toelichting":
        return <ToelichtingPagina toelichting={toelichting} onTabNavigeer={naarPagina} />;
      case "indeling":
        return (
          <div
            className="pt-root"
            style={{ minHeight: "100dvh", background: "#080808" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {huidigTeam ? (
              <TeamKaart
                key={teamIdx}
                team={huidigTeam}
                animKlasse="pt-team-in"
                onZoek={() => setZoekOpen(true)}
                seizoenLabel={toelichting?.seizoenLabel ?? null}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
                Geen teams beschikbaar
              </div>
            )}
          </div>
        );
      case "kennismaking":
        return (
          <KennismakingPagina
            kennismakingstrainingen={toelichting?.kennismakingstrainingen ?? []}
            kennismakingBlokken={toelichting?.kennismakingBlokken ?? []}
            seizoenLabel={toelichting?.seizoenLabel}
          />
        );
      case "kalender":
        return (
          <KalenderPagina
            kalenderBlokken={toelichting?.kalenderBlokken ?? []}
            belangrijkeData={toelichting?.belangrijkeData ?? []}
            seizoenLabel={toelichting?.seizoenLabel}
          />
        );
      case "tcoproep":
        return (
          <TcOproepPagina
            tcOproepBlokken={toelichting?.tcOproepBlokken ?? []}
            seizoenLabel={toelichting?.seizoenLabel}
          />
        );
      case "vragen":
        return (
          <VragenPagina
            vragenBlokken={toelichting?.vragenBlokken ?? []}
            seizoenLabel={toelichting?.seizoenLabel}
          />
        );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <main style={{ flex: 1, overflowY: "auto", background: "#080808" }}>{renderPagina()}</main>

      <AppFooter
        pagina={pagina}
        onNavigeer={naarPagina}
        teams={teams}
        teamIdx={teamIdx}
        onVorig={gaVorig}
        onVolgend={gaVolgend}
        onKiesTeam={naarTeam}
      />

      {zoekOpen && (
        <ZoekOverlay
          teams={teams}
          onSluit={() => setZoekOpen(false)}
          onKiesTeam={(idx) => {
            naarTeam(idx);
            setPagina("indeling");
            setZoekOpen(false);
          }}
        />
      )}
    </div>
  );
}
