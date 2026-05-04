import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL for the app under test.
 * Override with BASE_URL env variable for CI or local dev-server.
 * - Docker Compose: http://localhost  (default)
 * - Vite dev server: http://localhost:5173
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost";

export default defineConfig({
    testDir: "./tests",
    /* Run tests in files in parallel */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Single worker to avoid auth state conflicts between tests */
    workers: process.env.CI ? 1 : 1,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [["html", { open: "never" }], ["list"]],

    use: {
        baseURL: BASE_URL,
        /* Collect trace on retry */
        trace: "on-first-retry",
        /* Screenshots on failure */
        screenshot: "only-on-failure",
        /* Slow down actions slightly so they are visible in headed mode */
        actionTimeout: 10_000,
        navigationTimeout: 20_000,
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
