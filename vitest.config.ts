import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    include: ["tests/**/*.{test,spec}.ts", "src/**/*.{test,spec}.ts"],
    environment: "node",
    fileParallelism: false,
  },
});

