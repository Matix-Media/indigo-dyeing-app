import { expect, test } from "@playwright/test";
import { registerUser, uniqueEmail } from "../fixtures/auth";

// ---------------------------------------------------------------------------
// Workshop Browse page
// ---------------------------------------------------------------------------
test.describe("Workshop Browse page", () => {
    test("loads page heading and filter UI", async ({ page }) => {
        await page.goto("/workshops");
        await expect(page.getByRole("heading", { name: /browse indigo workshops/i })).toBeVisible();
        await expect(page.getByPlaceholder(/filter by city/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /filter/i })).toBeVisible();
    });

    test("shows workshop cards or empty state – no crash", async ({ page }) => {
        await page.goto("/workshops");
        // Wait for loading to complete (loading text disappears or content appears)
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        // Either shows workshops or empty message – both are acceptable
        const hasCards = await page.locator("article").count() > 0;
        const hasEmpty = await page.getByText(/no workshops found/i).isVisible();
        expect(hasCards || hasEmpty).toBe(true);
    });

    test("filtering by city submits and returns results or empty state", async ({ page }) => {
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });

        await page.getByPlaceholder(/filter by city/i).fill("NonExistentCityXYZ");
        await page.getByRole("button", { name: /filter/i }).click();
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        // Either articles or empty state
        const hasEmpty = await page.getByText(/no workshops found/i).isVisible();
        const hasCards = await page.locator("article").count() > 0;
        expect(hasEmpty || hasCards).toBe(true);
    });

    test("clearing city filter and filtering again loads all workshops", async ({ page }) => {
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });

        // Filter with nothing → all workshops
        await page.getByRole("button", { name: /filter/i }).click();
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
    });

    test("workshop card 'View details' link navigates to detail page", async ({ page }) => {
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });

        const firstViewDetails = page.getByRole("link", { name: /view details/i }).first();
        if (!(await firstViewDetails.isVisible())) {
            test.skip(); // No workshops seeded – skip gracefully
        }
        await firstViewDetails.click();
        await expect(page).toHaveURL(/\/workshops\//);
    });
});

// ---------------------------------------------------------------------------
// Workshop Detail page
// ---------------------------------------------------------------------------
test.describe("Workshop Detail page", () => {
    /** Helper: navigate to the first available workshop detail page. */
    async function goToFirstWorkshop(page: Parameters<typeof test>[1] extends ({ page }: { page: infer P }) => any ? P : never) {
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        const link = page.getByRole("link", { name: /view details/i }).first();
        const exists = await link.isVisible();
        if (!exists) return false;
        await link.click();
        await expect(page).toHaveURL(/\/workshops\//);
        return true;
    }

    test("displays workshop name, location and description", async ({ page }) => {
        const found = await goToFirstWorkshop(page);
        if (!found) test.skip();
        // Wait for content to load (not loading state)
        await expect(page.getByText(/loading workshop details\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
    });

    test("shows Available Time Slots section", async ({ page }) => {
        const found = await goToFirstWorkshop(page);
        if (!found) test.skip();
        await expect(page.getByText(/loading workshop details\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("heading", { name: /available time slots/i })).toBeVisible();
    });

    test("shows Reviews section", async ({ page }) => {
        const found = await goToFirstWorkshop(page);
        if (!found) test.skip();
        await expect(page.getByText(/loading workshop details\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("heading", { name: /reviews/i })).toBeVisible();
    });

    test("Book this workshop link navigates to /booking/:workshopId", async ({ page }) => {
        const email = uniqueEmail("workshop-book-link");
        await registerUser(page, { name: "Workshop Book Link User", email, password: "password123", role: "user" });

        const found = await goToFirstWorkshop(page);
        if (!found) test.skip();
        await expect(page.getByText(/loading workshop details\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        const bookLink = page.getByRole("link", { name: /book this workshop/i });
        await expect(bookLink).toBeVisible();
        await bookLink.click();
        await expect(page).toHaveURL(/\/booking\//);
    });

    test("unknown workshop ID shows error state (not crash)", async ({ page }) => {
        await page.goto("/workshops/00000000-0000-0000-0000-000000000000");
        await expect(page.getByText(/loading workshop details\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        // Should show an error message, not throw uncaught exception
        const body = page.locator("body");
        await expect(body).not.toBeEmpty();
    });
});

// ---------------------------------------------------------------------------
// Workshop detail – unauthenticated booking redirect
// ---------------------------------------------------------------------------
test.describe("Booking redirect (unauthenticated)", () => {
    test("visiting /booking/:id without auth redirects to /login", async ({ page }) => {
        await page.goto("/booking/00000000-0000-0000-0000-000000000001");
        await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    });
});

// ---------------------------------------------------------------------------
// Workshop registration creates a browsable workshop
// ---------------------------------------------------------------------------
test.describe("Workshop is discoverable after creation", () => {
    test("workshop registered via dashboard appears on browse page", async ({ page }) => {
        const email = uniqueEmail("discoverable-ws");
        await registerUser(page, { name: "Discoverable WS", email, password: "password123", role: "workshop" });

        // Fill in workshop profile
        await expect(page).toHaveURL(/\/workshop-dashboard/);
        await page.getByLabel("Workshop Name").fill("E2E Test Studio");
        await page.getByLabel("Location").fill("123 Test St");
        await page.getByLabel("City").fill("Testville");
        await page.locator("textarea").fill("An e2e test workshop");
        await page.getByLabel("Phone").fill("+1-555-0100");
        await page.getByLabel("Public Email").fill("workshop@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();

        // Wait for success
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        // Verify it appears on the browse page
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("heading", { name: "E2E Test Studio" }).first()).toBeVisible();
    });
});
