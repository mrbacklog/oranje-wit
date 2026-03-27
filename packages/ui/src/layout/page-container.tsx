"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

export interface PageContainerProps {
  children: ReactNode;
  /** Max breedte in px (default: 1200) */
  maxWidth?: number;
  /** Staggered fade-in animatie voor children (default: false) */
  animated?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────

export function PageContainer({
  children,
  maxWidth = 1200,
  animated = false,
  className = "",
}: PageContainerProps) {
  const containerStyle = {
    maxWidth: `${maxWidth}px`,
  };

  if (!animated) {
    return (
      <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${className}`} style={containerStyle}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${className}`}
      style={containerStyle}
    >
      {/* Elk direct child wordt geanimieerd */}
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={staggerItem}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
