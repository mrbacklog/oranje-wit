"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

interface RadarDataPoint {
  label: string;
  value: number;
}

interface RadarChartProps {
  /** Array of data points (typically 6: SCH/AAN/PAS/VER/FYS/MEN) */
  data: RadarDataPoint[];
  /** Maximum value on each axis (default 100) */
  maxValue?: number;
  /** Color for the data area — CSS color string or design token */
  color?: string;
  /** Chart diameter in pixels */
  size?: number;
  /** Enable mount animation */
  animated?: boolean;
  /** Additional CSS class */
  className?: string;
}

// ─── Geometry helpers ───────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleIndex: number,
  total: number
): [number, number] {
  // Start at top (-90deg), go clockwise
  const angle = (2 * Math.PI * angleIndex) / total - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function polygonPoints(cx: number, cy: number, radius: number, sides: number): string {
  return Array.from({ length: sides })
    .map((_, i) => {
      const [x, y] = polarToCartesian(cx, cy, radius, i, sides);
      return `${x},${y}`;
    })
    .join(" ");
}

// ─── Tooltip ────────────────────────────────────────────────────

function ChartTooltip({
  label,
  value,
  x,
  y,
}: {
  label: string;
  value: number;
  x: number;
  y: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
    >
      {/* Background */}
      <rect
        x={x - 32}
        y={y - 34}
        width={64}
        height={26}
        rx={6}
        fill="rgba(15, 17, 21, 0.9)"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={0.5}
        style={{ backdropFilter: "blur(8px)" }}
      />
      {/* Label */}
      <text
        x={x}
        y={y - 22}
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        fill="var(--text-tertiary)"
      >
        {label}
      </text>
      {/* Value */}
      <text
        x={x}
        y={y - 12}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="var(--text-primary)"
      >
        {value}
      </text>
    </motion.g>
  );
}

// ─── RadarChart Component ───────────────────────────────────────

export function RadarChart({
  data,
  maxValue = 100,
  color = "var(--ow-oranje-500)",
  size = 240,
  animated = true,
  className = "",
}: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sides = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 36; // Leave room for labels
  const rings = 5;

  // Build data polygon path
  const dataPoints = data.map((d, i) => {
    const r = (d.value / maxValue) * outerRadius;
    return polarToCartesian(cx, cy, r, i, sides);
  });
  const dataPath = "M " + dataPoints.map(([x, y]) => `${x},${y}`).join(" L ") + " Z";

  // Unique gradient ID
  const gradientId = `radar-gradient-${Math.random().toString(36).slice(2, 8)}`;
  const glowId = `radar-glow-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Radial gradient for the data fill */}
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.08} />
          </radialGradient>
          {/* Glow filter for data points */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid rings */}
        {Array.from({ length: rings }).map((_, ringIdx) => {
          const r = ((ringIdx + 1) / rings) * outerRadius;
          return (
            <polygon
              key={`ring-${ringIdx}`}
              points={polygonPoints(cx, cy, r, sides)}
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={ringIdx === rings - 1 ? 0.8 : 0.4}
              opacity={ringIdx === rings - 1 ? 0.6 : 0.3}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const [x, y] = polarToCartesian(cx, cy, outerRadius, i, sides);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--border-default)"
              strokeWidth={0.4}
              opacity={0.4}
            />
          );
        })}

        {/* Data area fill */}
        <motion.path
          d={dataPath}
          fill={`url(#${gradientId})`}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={animated ? { scale: 0, opacity: 0, transformOrigin: `${cx}px ${cy}px` } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        />

        {/* Data points (glow dots) */}
        {dataPoints.map(([x, y], i) => (
          <motion.g
            key={`dot-${i}`}
            initial={animated ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
          >
            {/* Outer glow */}
            <circle
              cx={x}
              cy={y}
              r={hoveredIndex === i ? 8 : 5}
              fill={color}
              opacity={hoveredIndex === i ? 0.2 : 0.12}
              style={{ transition: "all 0.2s ease" }}
            />
            {/* Inner dot */}
            <circle
              cx={x}
              cy={y}
              r={hoveredIndex === i ? 4 : 3}
              fill={color}
              filter={`url(#${glowId})`}
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </motion.g>
        ))}

        {/* Axis labels */}
        {data.map((d, i) => {
          const labelRadius = outerRadius + 18;
          const [x, y] = polarToCartesian(cx, cy, labelRadius, i, sides);
          const isTop = y < cy - outerRadius * 0.5;
          const isBottom = y > cy + outerRadius * 0.5;
          return (
            <motion.text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "central"}
              fontSize={11}
              fontWeight={hoveredIndex === i ? 700 : 500}
              fill={hoveredIndex === i ? "var(--text-primary)" : "var(--text-secondary)"}
              style={{
                transition: "fill 0.2s ease, font-weight 0.2s ease",
                fontFamily: "var(--font-body)",
                userSelect: "none",
              }}
              initial={animated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
            >
              {d.label}
            </motion.text>
          );
        })}

        {/* Tooltip on hover */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <ChartTooltip
              label={data[hoveredIndex].label}
              value={data[hoveredIndex].value}
              x={dataPoints[hoveredIndex][0]}
              y={dataPoints[hoveredIndex][1]}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
