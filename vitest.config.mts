import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(here, "src"),
      // "server-only" throws by design outside a server component. These
      // tests call the same functions directly, so stub it out.
      "server-only": resolve(here, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    // Pure logic only. Anything that needs a database or a browser is covered
    // by the checks in the deploy workflow, not here, so this suite stays fast
    // enough to run on every push.
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
  },
});
