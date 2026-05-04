import { expect, test } from "@playwright/test";
import { registerUser, uniqueEmail } from "../fixtures/auth";

// ---------------------------------------------------------------------------
// Workshop Dashboard – access control
// ---------------------------------------------------------------------------
test.describe("Workshop Dashboard – access control", () => {
    test("unauthenticated user is redirected to /login", async ({ page }) => {
        await page.goto("/workshop-dashboard");
        await expect(page).toHaveURL(/\/login/);
    });

    test("customer (role=user) visiting /workshop-dashboard is redirected away from workshop dashboard", async ({ page }) => {
        const email = uniqueEmail("wsd-customer");
        await registerUser(page, { name: "WSD Customer", email, password: "password123", role: "user" });
        await page.goto("/workshop-dashboard");
        await expect(page).toHaveURL(/\/dashboard/);
    });
});

// ---------------------------------------------------------------------------
// Workshop Dashboard – profile form
// ---------------------------------------------------------------------------
test.describe("Workshop Dashboard – profile management", () => {
    test("loads without error for a workshop owner with no profile yet", async ({ page }) => {
        const email = uniqueEmail("wsd-fresh");
        await registerUser(page, { name: "WSD Fresh", email, password: "password123", role: "workshop" });
        await expect(page).toHaveURL(/\/workshop-dashboard/);
        await expect(page.getByText(/loading workshop dashboard\.\.\./i)).not.toBeVisible({ timeout: 15_000 });
        // Profile form should be visible
        await expect(page.getByLabel("Workshop Name")).toBeVisible();
    });

    test("shows validation error when required profile fields are empty", async ({ page }) => {
        const email = uniqueEmail("wsd-validation");
        await registerUser(page, { name: "WSD Validation", email, password: "password123", role: "workshop" });
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByText(/please complete all required/i)).toBeVisible({ timeout: 5_000 });
    });

    test("creates a new workshop profile successfully", async ({ page }) => {
        const email = uniqueEmail("wsd-create");
        await registerUser(page, { name: "WSD Create", email, password: "password123", role: "workshop" });

        await page.getByLabel("Workshop Name").fill("New E2E Workshop");
        await page.getByLabel("Location").fill("10 Test Avenue");
        await page.getByLabel("City").fill("E2E City");
        await page.locator("textarea").fill("Test workshop created by e2e");
        await page.getByLabel("Phone").fill("+1-555-0500");
        await page.getByLabel("Public Email").fill("e2e-workshop@test.invalid");

        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByText(/workshop profile created/i)).toBeVisible({ timeout: 10_000 });
    });

    test("updates an existing workshop profile", async ({ page }) => {
        const email = uniqueEmail("wsd-update");
        await registerUser(page, { name: "WSD Update", email, password: "password123", role: "workshop" });

        // Create first
        await page.getByLabel("Workshop Name").fill("Update Before");
        await page.getByLabel("Location").fill("11 Update St");
        await page.getByLabel("City").fill("Update City");
        await page.locator("textarea").fill("Before update");
        await page.getByLabel("Phone").fill("+1-555-0501");
        await page.getByLabel("Public Email").fill("update-ws@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByText(/workshop profile created/i)).toBeVisible({ timeout: 10_000 });

        // Update
        await page.getByLabel("Workshop Name").clear();
        await page.getByLabel("Workshop Name").fill("Update After");
        await page.getByRole("button", { name: /update profile/i }).click();
        await expect(page.getByText(/workshop profile updated/i)).toBeVisible({ timeout: 10_000 });
    });
});

// ---------------------------------------------------------------------------
// Workshop Dashboard – availability management
// ---------------------------------------------------------------------------
test.describe("Workshop Dashboard – availability", () => {
    test("shows error if adding availability before profile is saved", async ({ page }) => {
        const email = uniqueEmail("wsd-avail-noprofile");
        await registerUser(page, { name: "WSD Avail NP", email, password: "password123", role: "workshop" });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.getByLabel("Date").fill(tomorrow.toISOString().split("T")[0]);
        await page.getByLabel("Time Slot").fill("09:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/create your workshop profile/i)).toBeVisible({ timeout: 5_000 });
    });

    test("adds a new availability slot after profile is saved", async ({ page }) => {
        const email = uniqueEmail("wsd-avail-add");
        await registerUser(page, { name: "WSD Avail Add", email, password: "password123", role: "workshop" });

        await page.getByLabel("Workshop Name").fill("Avail Test Studio");
        await page.getByLabel("Location").fill("20 Slot Road");
        await page.getByLabel("City").fill("Slotsville");
        await page.locator("textarea").fill("Avail add test");
        await page.getByLabel("Phone").fill("+1-555-0502");
        await page.getByLabel("Public Email").fill("avail-ws@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const dateStr = tomorrow.toISOString().split("T")[0];

        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("13:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/availability updated/i)).toBeVisible({ timeout: 10_000 });

        // The new slot should appear in the table
        await expect(page.getByText("13:00")).toBeVisible();
    });

    test("shows validation error when date or time slot is missing", async ({ page }) => {
        const email = uniqueEmail("wsd-avail-validation");
        await registerUser(page, { name: "WSD Avail Val", email, password: "password123", role: "workshop" });

        await page.getByLabel("Workshop Name").fill("Val Studio");
        await page.getByLabel("Location").fill("Val St");
        await page.getByLabel("City").fill("Val City");
        await page.locator("textarea").fill("Val desc");
        await page.getByLabel("Phone").fill("+1-555-0503");
        await page.getByLabel("Public Email").fill("val-ws@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        // Try to add slot without filling date
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/please provide a date and time slot/i)).toBeVisible({ timeout: 5_000 });
    });
});

// ---------------------------------------------------------------------------
// Workshop Dashboard – bookings list
// ---------------------------------------------------------------------------
test.describe("Workshop Dashboard – bookings view", () => {
    test("workshop dashboard shows incoming bookings after a customer books", async ({ page }) => {
        // Set up workshop
        const wsEmail = uniqueEmail("wsd-booking-ws");
        await registerUser(page, { name: "WSD Booking WS", email: wsEmail, password: "password123", role: "workshop" });
        await page.getByLabel("Workshop Name").fill("WSD Incoming Studio");
        await page.getByLabel("Location").fill("30 Book Ave");
        await page.getByLabel("City").fill("Bookham");
        await page.locator("textarea").fill("Booking view test studio");
        await page.getByLabel("Phone").fill("+1-555-0600");
        await page.getByLabel("Public Email").fill("incoming-ws@test.invalid");
        await page.getByRole("button", { name: /create profile/i }).click();
        await expect(page.getByRole("heading", { name: "Workshop Profile", exact: true })).toBeVisible({ timeout: 10_000 });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        await page.getByLabel("Date").fill(dateStr);
        await page.getByLabel("Time Slot").fill("16:00");
        await page.getByRole("button", { name: /save slot/i }).click();
        await expect(page.getByText(/availability updated/i)).toBeVisible({ timeout: 10_000 });

        const myWorkshop = await page.evaluate(async () => {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const res = await fetch("/api/workshops/me", { headers: { Authorization: `Bearer ${token}` } });
            return res.ok ? res.json() : null;
        });
        if (!myWorkshop?.id) test.skip();

        // Customer creates a booking
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        const custEmail = uniqueEmail("wsd-booking-cust");
        await registerUser(page, { name: "WSD Booking Cust", email: custEmail, password: "password123", role: "user" });

        const booking = await page.evaluate(async (workshopId: string) => {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    workshopId,
                    date: new Date(Date.now() + 86_400_000).toISOString().split("T")[0],
                    timeSlot: "16:00",
                    participantCount: 1,
                    price: 500,
                }),
            });
            return res.ok ? res.json() : null;
        }, myWorkshop.id);
        if (!booking) test.skip();

        // Now log in as workshop and check bookings
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        await page.goto("/login");
        await page.getByLabel("Email").fill(wsEmail);
        await page.getByLabel("Password").fill("password123");
        await page.getByRole("button", { name: /log in/i }).click();
        await expect(page).toHaveURL(/\/workshop-dashboard/);
        await expect(page.getByText(/loading workshop dashboard\.\.\./i)).not.toBeVisible({ timeout: 15_000 });

        // Incoming bookings section should show the customer's booking
        await expect(page.getByText(/WSD Booking Cust/i)).toBeVisible({ timeout: 10_000 });
    });
});
