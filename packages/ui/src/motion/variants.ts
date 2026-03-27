/**
 * OW Design System — Gedeelde Framer Motion variants
 *
 * Gebruik deze variants voor consistente animaties over alle apps.
 * Import: import { fadeIn, slideUp, staggerContainer } from "@oranje-wit/ui/motion";
 */

import type { Variants, Transition } from "framer-motion";

// ─── Transitions ────────────────────────────────────────────────

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

export const easeOut: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

export const easeFast: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

// ─── Page Transitions ───────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -10, transition: easeFast },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: -20, transition: easeFast },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: springGentle },
  exit: { opacity: 0, scale: 0.95, transition: easeFast },
};

// ─── List & Container ───────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeOut },
};

// ─── Card Animations ────────────────────────────────────────────

export const cardFlip: Variants = {
  front: { rotateY: 0, transition: springGentle },
  back: { rotateY: 180, transition: springGentle },
};

export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    filter: "brightness(2)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "brightness(1)",
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

// ─── Micro-interactions ─────────────────────────────────────────

/** Subtiele schaal-bounce voor tap feedback */
export const hapticBounce = {
  whileTap: { scale: 0.97 },
  transition: springSnappy,
};

/** Hover lift voor kaarten */
export const hoverLift = {
  whileHover: { y: -2, transition: easeFast },
};

/** Combinatie: tap + hover voor interactieve kaarten */
export const cardInteraction = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: springSnappy,
};

// ─── Bottom Sheet ───────────────────────────────────────────────

export const bottomSheet: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: "100%", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

// ─── Overlay ────────────────────────────────────────────────────

export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Carousel / Swipe ───────────────────────────────────────────

export const carouselSlide = (direction: number): Variants => ({
  enter: { x: direction > 0 ? "100%" : "-100%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: springGentle },
  exit: { x: direction > 0 ? "-100%" : "100%", opacity: 0, transition: easeFast },
});

// ─── Spring preset voor overlays ────────────────────────────────

export const springOverlay: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// ─── Toast ──────────────────────────────────────────────────────

export const toastSlide: Variants = {
  hidden: { opacity: 0, y: -40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springOverlay },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: easeFast },
};

// ─── Action Sheet ───────────────────────────────────────────────

export const actionSheet: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: springOverlay },
  exit: { y: "100%", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

// ─── Dialog / Confirm ───────────────────────────────────────────

export const dialogScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: springOverlay },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// ─── Drawer ─────────────────────────────────────────────────────

export const drawerSlide = (side: "left" | "right"): Variants => ({
  hidden: { x: side === "left" ? "-100%" : "100%" },
  visible: { x: 0, transition: springOverlay },
  exit: {
    x: side === "left" ? "-100%" : "100%",
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
});

// ─── Popover ────────────────────────────────────────────────────

export const popoverScale: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springOverlay },
  exit: { opacity: 0, scale: 0.92, y: -4, transition: easeFast },
};
