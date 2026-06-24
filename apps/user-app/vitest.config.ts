import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["app/lib/__tests__/**/*.test.ts"],
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
    resolve: {
        alias: {
            "@repo/db/client": resolve(__dirname, "../../packages/db/index.ts"),
            "@repo/db": resolve(__dirname, "../../packages/db/index.ts"),
        },
    },
});
