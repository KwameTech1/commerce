import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      lib: path.resolve(__dirname, "lib"),
      components: path.resolve(__dirname, "components"),
    },
  },
});
