import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // vmThreads deelt globalThis tussen VM-contexten in dezelfde worker-thread,
    // waardoor de globalForPrisma singleton uit @oranje-wit/database lekt tussen
    // test-bestanden. forks geeft elk bestand een eigen process en echte isolatie.
    pool: "forks",
  },
});
