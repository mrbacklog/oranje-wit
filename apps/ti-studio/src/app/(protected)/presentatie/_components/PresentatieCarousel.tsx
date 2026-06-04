"use client";
import { useMemo, useState } from "react";
// Swiper CSS — client-side only
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel, Keyboard, Pagination } from "swiper/modules";
import type { PresentatieTeam } from "../presentatie-types";
import { PresentatieFilterBar, filterTeams, type FilterWaarde } from "./PresentatieFilterBar";
import { TeamPresentatieKaart } from "./TeamPresentatieKaart";

interface PresentatieCarouselProps {
  teams: PresentatieTeam[];
  peildatum: string; // ISO-string
}

export function PresentatieCarousel({ teams, peildatum }: PresentatieCarouselProps) {
  const [filter, setFilter] = useState<FilterWaarde>("alle");

  const peildatumDate = useMemo(() => new Date(peildatum), [peildatum]);
  const gefilterd = useMemo(() => filterTeams(teams, filter), [teams, filter]);

  if (teams.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 400,
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Geen teams gevonden voor dit seizoen.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-0)",
        overflow: "hidden",
      }}
    >
      {/* Sticky filterbalk */}
      <PresentatieFilterBar actief={filter} onChange={setFilter} teams={teams} />

      {/* Carrousel */}
      {gefilterd.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-3)",
            fontSize: 14,
          }}
        >
          Geen teams in dit filter.
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: "radial-gradient(ellipse at center, #131318, #0a0a0d 72%)",
            overflow: "hidden",
          }}
        >
          <Swiper
            modules={[EffectCoverflow, Mousewheel, Keyboard, Pagination]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            spaceBetween={40}
            mousewheel={{ forceToAxis: true }}
            keyboard={{ enabled: true }}
            pagination={{ clickable: true }}
            coverflowEffect={{
              rotate: 8,
              stretch: 0,
              depth: 120,
              scale: 0.95,
              slideShadows: false,
              modifier: 1,
            }}
            style={{
              width: "100%",
              flex: 1,
              paddingTop: 24,
              paddingBottom: 48,
              // Paginatie-puntjes — oranje accent
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ["--swiper-pagination-color" as any]: "var(--accent)",
              ["--swiper-pagination-bullet-inactive-color" as any]: "var(--border-1)",
              ["--swiper-pagination-bullet-inactive-opacity" as any]: "1",
              ["--swiper-pagination-bullet-size" as any]: "8px",
            }}
          >
            {gefilterd.map((team) => (
              <SwiperSlide
                key={team.id}
                style={{
                  width: 430,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <TeamPresentatieKaart
                    team={team}
                    peildatum={peildatumDate}
                    fidelity={isActive ? "center" : "side"}
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
