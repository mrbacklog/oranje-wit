"use client";
import { useMemo, useState, type CSSProperties } from "react";
// Swiper CSS — client-side only
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel, Keyboard, Pagination } from "swiper/modules";
import type { PresentatieTeam } from "../presentatie-types";
import { PresentatieFilterBar, filterTeams, type FilterWaarde } from "./PresentatieFilterBar";
import { TeamPresentatieKaart, kaartBreedte } from "./TeamPresentatieKaart";

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
            spaceBetween={36}
            // forceToAxis:false → een verticaal muiswiel slidet de carrousel horizontaal
            mousewheel={{ forceToAxis: false, sensitivity: 1 }}
            keyboard={{ enabled: true }}
            pagination={{ clickable: true }}
            coverflowEffect={{
              rotate: 6,
              stretch: 0,
              depth: 110,
              scale: 0.92,
              slideShadows: false,
              modifier: 1,
            }}
            style={
              {
                width: "100%",
                flex: 1,
                paddingTop: 24,
                paddingBottom: 48,
                // Paginatie-puntjes — oranje accent (Swiper CSS-vars)
                "--swiper-pagination-color": "var(--accent)",
                "--swiper-pagination-bullet-inactive-color": "var(--border-1)",
                "--swiper-pagination-bullet-inactive-opacity": "1",
                "--swiper-pagination-bullet-size": "8px",
              } as CSSProperties
            }
          >
            {gefilterd.map((team) => (
              <SwiperSlide
                key={team.id}
                style={{
                  // Elke slide krijgt de natuurlijke kaartbreedte — coverflow centreert correct
                  // door de combinatie van slidesPerView="auto" + centeredSlides.
                  width: kaartBreedte(team),
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TeamPresentatieKaart team={team} peildatum={peildatumDate} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
