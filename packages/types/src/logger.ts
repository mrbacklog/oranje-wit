type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

const CONSOLE_METHOD: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug, // eslint-disable-line no-console
  info: console.info, // eslint-disable-line no-console
  warn: console.warn,
  error: console.error,
};

function formatJson(level: LogLevel, args: unknown[]): string {
  const entry: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
  };

  let message: string | undefined;
  const data: unknown[] = [];
  let error: { name: string; message: string; stack?: string } | undefined;

  for (const arg of args) {
    if (arg instanceof Error) {
      error = { name: arg.name, message: arg.message, stack: arg.stack };
    } else if (message === undefined && typeof arg === "string") {
      message = arg;
    } else {
      data.push(arg);
    }
  }

  if (message !== undefined) entry.message = message;
  if (data.length > 0) entry.data = data;
  if (error) entry.error = error;

  return JSON.stringify(entry);
}

function log(level: LogLevel, args: unknown[]): void {
  if (!shouldLog(level)) return;

  if (IS_PRODUCTION) {
    CONSOLE_METHOD[level](formatJson(level, args));
  } else {
    CONSOLE_METHOD[level](`[${level.toUpperCase()}]`, ...args);
  }
}

export const logger = {
  debug: (...args: unknown[]) => log("debug", args),
  info: (...args: unknown[]) => log("info", args),
  warn: (...args: unknown[]) => log("warn", args),
  error: (...args: unknown[]) => log("error", args),
};
