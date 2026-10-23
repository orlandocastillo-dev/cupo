import { defineConfig } from "vitest/config";

// Sintetizar el stack empaqueta las tres Lambdas con esbuild, por eso el tiempo extra.
export default defineConfig({ test: { testTimeout: 120_000, hookTimeout: 120_000 } });
