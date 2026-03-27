"use client";

import { useRef, type ReactNode } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { useZoomScale } from "./ZoomScaleContext";

interface GestureCardProps {
  cardId: string;
  position: { x: number; y: number };
  onDragEnd: (cardId: string, deltaX: number, deltaY: number) => void;
  children: ReactNode;
}

export default function GestureCard({ cardId, position, onDragEnd, children }: GestureCardProps) {
  const zoomScale = useZoomScale();
  const accumulatedDelta = useRef({ x: 0, y: 0 });

  const [spring, api] = useSpring(() => ({
    x: 0,
    y: 0,
    immediate: true,
  }));

  const bind = useDrag(
    ({ delta: [dx, dy], first, last, tap, event }) => {
      // Tap = klik, geen drag — negeer volledig
      if (tap) return;

      // Don't start card-drag if the user is dragging a dnd-kit speler element
      const target = event?.target as HTMLElement | null;
      if (target?.closest("[data-dnd-draggable]")) return;

      event?.stopPropagation();

      if (first) {
        accumulatedDelta.current = { x: 0, y: 0 };
      }

      const compensatedDx = dx / zoomScale;
      const compensatedDy = dy / zoomScale;

      accumulatedDelta.current.x += compensatedDx;
      accumulatedDelta.current.y += compensatedDy;

      if (last) {
        const { x: adx, y: ady } = accumulatedDelta.current;
        // Ignore micro-drags (< 10px) to prevent card jumping on click
        if (Math.abs(adx) > 10 || Math.abs(ady) > 10) {
          onDragEnd(cardId, adx, ady);
        }
        api.start({ x: 0, y: 0, immediate: true });
      } else {
        api.start({
          x: accumulatedDelta.current.x,
          y: accumulatedDelta.current.y,
          immediate: true,
        });
      }
    },
    {
      filterTaps: true,
      threshold: 8,
      delay: 200,
    }
  );

  return (
    <animated.div
      {...bind()}
      data-gesture-card
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        x: spring.x,
        y: spring.y,
        touchAction: "none",
        cursor: "grab",
      }}
    >
      {children}
    </animated.div>
  );
}
