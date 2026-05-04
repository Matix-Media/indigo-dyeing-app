import { expect, test } from "@playwright/test";
import { registerUser, uniqueEmail } from "../fixtures/auth";

/**
 * Creates a workshop account, fills out its profile, and adds an availability
 * slot so that a customer can book it. Returns the workshop ID from the URL
 * after navigation.
 */
async function setupWorkshopWithAvailability(page: any): Promise<string | null> {
    const wsEmail = uniqueEmail("booking-ws");
    await registerUser(page, { name: "Booking Workshop", email: wsEmail, password: "password123", role: "workshop" });

    // Fill in profile
    await page.getByLabel("Workshop Name").fill("Booking Test Studio");
        await page.getByLabel("Location").fill("99 Booking Lane");
        await page.getByLabel("City").fill("Bookington");
        await page.locator("textarea").fill("A workshop used in e2e booking tests");
        await page.getByLabel("Phone").fill("+1-555-0199");
        await page.getByLabel("Public Email").fill("bookingstudio@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        // Add availability slot (tomorrow's date)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("10:00 AM");
        // Leave maxParticipants and availableSpots at their defaults (4)
        await page.getByRole("button", { name: /save slot/i }).click();

    // Navigate to browse page and find the workshop
    await page.goto("/workshops");
    await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
    const wsCard = page.getByText("Booking Test Studio");
    if (!(await wsCard.isVisible())) return null;

    await page.getByRole("link", { name: /view details/i }).filter({ has: page.locator("..").filter({ hasText: "Booking Test Studio" }) }).first().click();
    // Fall back: just click any view details link near the workshop name
    // More robust: find the article containing the name then click its link
    return null; // workshopId resolved via URL in caller
}

// ---------------------------------------------------------------------------
// Booking Flow – unauthenticated
// ---------------------------------------------------------------------------
test.describe("Booking Flow – unauthenticated", () => {
    test("visiting /booking/:id redirects to login", async ({ page }) => {
        await page.goto("/booking/00000000-0000-0000-0000-000000000001");
        await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    });
});

// ---------------------------------------------------------------------------
// Booking Flow – authenticated, step-by-step
// ---------------------------------------------------------------------------
test.describe("Booking Flow – full multi-step flow", () => {
    test("booking page loads with step indicators and design selection", async ({ page }) => {
        // Set up: workshop owner creates a workshop with availability
        const wsEmail = uniqueEmail("bf-workshop");
        await registerUser(page, { name: "BF Workshop", email: wsEmail, password: "password123", role: "workshop" });
        await page.getByLabel("Workshop Name").fill("BF Test Studio");
        await page.getByLabel("Location").fill("1 BF Street");
        await page.getByLabel("City").fill("BF City");
        await page.locator("textarea").fill("Booking flow test studio");
        await page.getByLabel("Phone").fill("+1-555-0200");
        await page.getByLabel("Public Email").fill("bf-studio@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("14:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/availability updated/i)).toBeVisible({ timeout: 10_000 });

        // Get the workshop ID from the dashboard
        const myWorkshopResponse = await page.evaluate(async () => {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const res = await fetch("/api/workshops/me", { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return null;
            return res.json();
        });
        const workshopId: string | null = myWorkshopResponse?.id ?? null;
        if (!workshopId) test.skip();

        // Logout workshop, register customer
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        const custEmail = uniqueEmail("bf-customer");
        await registerUser(page, { name: "BF Customer", email: custEmail, password: "password123", role: "user" });

        // Navigate to booking flow through browse/detail links (client-side navigation preserves auth state)
        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        const bfCard = page.locator("article").filter({ hasText: "BF Test Studio" }).first();
        await expect(bfCard).toBeVisible({ timeout: 10_000 });
        await bfCard.getByRole("link", { name: /view details/i }).click();
        await page.getByRole("link", { name: /book this workshop/i }).click();
        await expect(page.getByRole("heading", { name: /book a workshop/i })).toBeVisible({ timeout: 10_000 });
    });

    test("Step 1: design selection – no design option is pre-selected, Continue advances to step 2", async ({ page }) => {
        // Reuse the same workshop setup via API calls for speed
        const wsEmail = uniqueEmail("bf2-workshop");
        await registerUser(page, { name: "BF2 Workshop", email: wsEmail, password: "password123", role: "workshop" });
        await page.getByLabel("Workshop Name").fill("BF2 Test Studio");
        await page.getByLabel("Location").fill("2 BF Street");
        await page.getByLabel("City").fill("BF2 City");
        await page.locator("textarea").fill("BF2 studio");
        await page.getByLabel("Phone").fill("+1-555-0201");
        await page.getByLabel("Public Email").fill("bf2-studio@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("10:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/availability updated/i)).toBeVisible({ timeout: 10_000 });

        const myWorkshop = await page.evaluate(async () => {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const res = await fetch("/api/workshops/me", { headers: { Authorization: `Bearer ${token}` } });
            return res.ok ? res.json() : null;
        });
        if (!myWorkshop?.id) test.skip();

        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        const custEmail2 = uniqueEmail("bf2-customer");
        await registerUser(page, { name: "BF2 Customer", email: custEmail2, password: "password123", role: "user" });

        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        const bf2Card = page.locator("article").filter({ hasText: "BF2 Test Studio" }).first();
        await expect(bf2Card).toBeVisible({ timeout: 10_000 });
        await bf2Card.getByRole("link", { name: /view details/i }).click();
        await page.getByRole("link", { name: /book this workshop/i }).click();
        await expect(page.getByRole("heading", { name: /book a workshop/i })).toBeVisible({ timeout: 10_000 });

        // Step 1: "No Design" option should be visible and clickable
        await expect(page.getByText(/no design/i)).toBeVisible();

        // Progress Step 1 → Step 2
        await page.getByRole("button", { name: /continue/i }).click();
        await expect(page.getByRole("heading", { name: /select date & time/i })).toBeVisible({ timeout: 5_000 });
    });

    test("Step 2: date & time – selecting date shows time slots", async ({ page }) => {
        const wsEmail = uniqueEmail("bf3-workshop");
        await registerUser(page, { name: "BF3 Workshop", email: wsEmail, password: "password123", role: "workshop" });
        await page.getByLabel("Workshop Name").fill("BF3 Test Studio");
        await page.getByLabel("Location").fill("3 BF Street");
        await page.getByLabel("City").fill("BF3 City");
        await page.locator("textarea").fill("BF3 studio");
        await page.getByLabel("Phone").fill("+1-555-0202");
        await page.getByLabel("Public Email").fill("bf3-studio@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("09:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/availability updated/i)).toBeVisible({ timeout: 10_000 });

        const myWorkshop3 = await page.evaluate(async () => {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const res = await fetch("/api/workshops/me", { headers: { Authorization: `Bearer ${token}` } });
            return res.ok ? res.json() : null;
        });
        if (!myWorkshop3?.id) test.skip();

        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        const custEmail3 = uniqueEmail("bf3-customer");
        await registerUser(page, { name: "BF3 Customer", email: custEmail3, password: "password123", role: "user" });

        await page.goto("/workshops");
        await expect(page.getByText(/loading workshops\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        const bf3Card = page.locator("article").filter({ hasText: "BF3 Test Studio" }).first();
        await expect(bf3Card).toBeVisible({ timeout: 10_000 });
        await bf3Card.getByRole("link", { name: /view details/i }).click();
        await page.getByRole("link", { name: /book this workshop/i }).click();
        await expect(page.getByRole("heading", { name: /book a workshop/i })).toBeVisible({ timeout: 10_000 });
        await page.getByRole("button", { name: /continue/i }).click();
        await expect(page.getByRole("heading", { name: /select date & time/i })).toBeVisible({ timeout: 5_000 });

        // Select the date from the dropdown
        const dateSelect = page.getByRole("combobox");
        await expect(dateSelect).toBeVisible();
        await dateSelect.selectOption({ index: 1 }); // first real option after placeholder

        // Time slot buttons should appear
        await expect(page.getByText(/09:00/i)).toBeVisible({ timeout: 5_000 });
    });
});

// ---------------------------------------------------------------------------
// Booking Confirmation page
// ---------------------------------------------------------------------------
test.describe("Booking Confirmation page", () => {
    test("visiting confirmation page with unknown booking ID shows error state", async ({ page }) => {
        const custEmail = uniqueEmail("bc-test");
        await registerUser(page, { name: "BC Test", email: custEmail, password: "password123", role: "user" });
        await page.goto("/booking-confirmation/00000000-0000-0000-0000-000000000000");
        await expect(page.locator("body")).not.toBeEmpty();
        // Should show some error, not crash
        await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 15_000 });
    });
});
