"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Preferred position */
  position?: TooltipPosition;
  /** The trigger element */
  children: ReactElement;
  /** Delay before showing (ms) */
  delay?: number;
  /** Additional CSS class for the tooltip */
  className?: string;
}

// ─── Arrow SVG paths ────────────────────────────────────────────

const arrowPaths: Record<TooltipPosition, string> = {
  top: "M0,0 L6,6 L12,0",
  bottom: "M0,6 L6,0 L12,6",
  left: "M0,0 L6,6 L0,12",
  right: "M6,0 L0,6 L6,12",
};

const arrowDimensions: Record<TooltipPosition, { width: number; height: number }> = {
  top: { width: 12, height: 6 },
  bottom: { width: 12, height: 6 },
  left: { width: 6, height: 12 },
  right: { width: 6, height: 12 },
};

// ─── Motion offsets ─────────────────────────────────────────────

const positionTransform: Record<TooltipPosition, { x: number; y: number }> = {
  top: { x: 0, y: 4 },
  bottom: { x: 0, y: -4 },
  left: { x: 4, y: 0 },
  right: { x: -4, y: 0 },
};

// ─── Position styles ────────────────────────────────────────────

function getPositionStyle(pos: TooltipPosition): React.CSSProperties {
  const gap = 8;
  switch (pos) {
    case "top":
      return {
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: gap,
      };
    case "bottom":
      return {
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: gap,
      };
    case "left":
      return {
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginRight: gap,
      };
    case "right":
      return {
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginLeft: gap,
      };
  }
}

function getArrowStyle(pos: TooltipPosition): React.CSSProperties {
  switch (pos) {
    case "top":
      return { bottom: -5, left: "50%", transform: "translateX(-50%)" };
    case "bottom":
      return { top: -5, left: "50%", transform: "translateX(-50%)" };
    case "left":
      return { right: -5, top: "50%", transform: "translateY(-50%)" };
    case "right":
      return { left: -5, top: "50%", transform: "translateY(-50%)" };
  }
}

// ─── Tooltip Component ──────────────────────────────────────────

export function Tooltip({
  content,
  position = "top",
  children,
  delay = 200,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const { x: initX, y: initY } = positionTransform[position];
  const arrow = arrowDimensions[position];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            role="tooltip"
            className={`pointer-events-none absolute whitespace-nowrap ${className}`}
            style={{
              ...getPositionStyle(position),
              zIndex: 60,
            }}
            initial={{ opacity: 0, scale: 0.92, x: initX, y: initY }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: initX, y: initY }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Tooltip body */}
            <div
              className="relative rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: "rgba(15, 17, 21, 0.92)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset",
                maxWidth: 240,
                lineHeight: 1.4,
              }}
            >
              {content}

              {/* Arrow */}
              <svg
                width={arrow.width}
                height={arrow.height}
                viewBox={`0 0 ${arrow.width} ${arrow.height}`}
                className="absolute"
                style={{
                  ...getArrowStyle(position),
                  fill: "rgba(15, 17, 21, 0.92)",
                }}
              >
                <path d={arrowPaths[position]} />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
