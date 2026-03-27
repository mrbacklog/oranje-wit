"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// ─── Sparkline (mini inline chart) ──────────────────────────────

function Sparkline({ data, color = "var(--ow-oranje-500)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 24;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1"
      style={{ overflow: "visible" }}
    >
      {/* Gradient fill under line */}
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaD}
        fill="url(#sparkFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      />
      {/* Glow dot on last point */}
      <motion.circle
        cx={Number(points[points.length - 1].split(",")[0])}
        cy={Number(points[points.length - 1].split(",")[1])}
        r={2.5}
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
      <motion.circle
        cx={Number(points[points.length - 1].split(",")[0])}
        cy={Number(points[points.length - 1].split(",")[1])}
        r={5}
        fill={color}
        opacity={0.2}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
    </svg>
  );
}

// ─── Count-up animated number ───────────────────────────────────

function CountUp({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });
  const [display, setDisplay] = useState(`${prefix}${(0).toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.4, 0, 0.2, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionVal, rounded]);

  return <>{display}</>;
}

// ─── Trend indicator ────────────────────────────────────────────

function TrendIndicator({ direction, value }: { direction: "up" | "down"; value: string }) {
  const isUp = direction === "up";
  return (
    <motion.span
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color: isUp ? "var(--color-success-500)" : "var(--color-error-500)" }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ transform: isUp ? "none" : "rotate(180deg)" }}
      >
        <path
          d="M7 2.5v9M7 2.5L3.5 6M7 2.5l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {value}
    </motion.span>
  );
}

// ─── Types ──────────────────────────────────────────────────────

interface MetricProps {
  /** The metric value (number for count-up animation, string for static) */
  value: number | string;
  /** Label displayed below the value */
  label: string;
  /** Trend direction */
  trend?: "up" | "down";
  /** Trend display value (e.g., "+12%", "-3") */
  trendValue?: string;
  /** Data points for a mini sparkline */
  sparkData?: number[];
  /** Wrap in a glassmorphism card */
  withCard?: boolean;
  /** Value color gradient: "oranje" | "wit" | custom CSS color */
  gradient?: "oranje" | "wit" | string;
  /** Number of decimal places for count-up */
  decimals?: number;
  /** Prefix for the value (e.g., "$", "#") */
  prefix?: string;
  /** Suffix for the value (e.g., "%", "km") */
  suffix?: string;
  /** Additional CSS class */
  className?: string;
}

// ─── Metric Component ───────────────────────────────────────────

export function Metric({
  value,
  label,
  trend,
  trendValue,
  sparkData,
  withCard = false,
  gradient = "wit",
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: MetricProps) {
  const isNumber = typeof value === "number";

  // Gradient style for the value text
  const gradientStyle = (() => {
    if (gradient === "oranje") {
      return {
        background: "linear-gradient(135deg, var(--ow-oranje-400), var(--ow-oranje-600))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      } as React.CSSProperties;
    }
    if (gradient === "wit") {
      return {
        background: "linear-gradient(180deg, var(--text-primary) 20%, var(--text-secondary) 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      } as React.CSSProperties;
    }
    // Custom color
    return { color: gradient } as React.CSSProperties;
  })();

  const content = (
    <motion.div
      className={`flex flex-col ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Value row */}
      <div className="flex items-end gap-3">
        <span
          className="text-5xl leading-none font-bold tracking-tight"
          style={{
            ...gradientStyle,
            fontFamily: "var(--font-heading)",
            letterSpacing: "var(--tracking-stat)",
          }}
        >
          {isNumber ? (
            <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          ) : (
            `${prefix}${value}${suffix}`
          )}
        </span>
        {trend && trendValue && <TrendIndicator direction={trend} value={trendValue} />}
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length >= 2 && (
        <Sparkline
          data={sparkData}
          color={gradient === "oranje" ? "var(--ow-oranje-500)" : "var(--text-tertiary)"}
        />
      )}

      {/* Label */}
      <motion.p
        className="mt-1.5 text-xs font-medium tracking-wide uppercase"
        style={{ color: "var(--text-tertiary)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {label}
      </motion.p>
    </motion.div>
  );

  if (!withCard) return content;

  // Glassmorphism card wrapper
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        backgroundColor: "rgba(26, 29, 35, 0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "rgba(255, 255, 255, 0.06)",
        boxShadow: `
          0 0 0 1px rgba(255, 255, 255, 0.03) inset,
          0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
          var(--shadow-md)
        `,
      }}
      whileHover={{
        y: -2,
        boxShadow: `
          0 0 0 1px rgba(255, 255, 255, 0.05) inset,
          0 1px 0 0 rgba(255, 255, 255, 0.06) inset,
          var(--shadow-lg)
        `,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Subtle inner glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(
            ellipse 80% 50% at 50% -10%,
            rgba(255, 133, 51, 0.06),
            transparent
          )`,
        }}
      />
      <div className="relative">{content}</div>
    </motion.div>
  );
}
