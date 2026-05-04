import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
    test("loads with hero heading and CTAs", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { name: /create your own indigo design/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /start designing/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /browse workshops/i })).toBeVisible();
    });

    test("shows How It Works section with three steps", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Design", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: /book/i })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Create", exact: true })).toBeVisible();
    });

    test("Start Designing link navigates to /design-studio", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: /start designing/i }).click();
        await expect(page).toHaveURL(/\/design-studio/);
    });

    test("Browse Workshops link navigates to /workshops", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: /browse workshops/i }).click();
        await expect(page).toHaveURL(/\/workshops/);
    });
});

test.describe("Navigation header", () => {
    test("shows logo link to home", async ({ page }) => {
        await page.goto("/workshops");
        await page.getByRole("link", { name: /indigo/i }).first().click();
        await expect(page).toHaveURL("/");
    });

    test("nav contains Workshops and Design Studio links", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("navigation").getByRole("link", { name: "Workshops", exact: true })).toBeVisible();
        await expect(page.getByRole("navigation").getByRole("link", { name: "Design Studio", exact: true })).toBeVisible();
    });

    test("nav shows Login and Sign Up when unauthenticated", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
    });

    test("nav Login link navigates to /login", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/login/);
    });

    test("nav Sign Up link navigates to /register", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: "Sign Up" }).click();
        await expect(page).toHaveURL(/\/register/);
    });
});

test.describe("404 / Not Found page", () => {
    test("shows not found content for unknown routes", async ({ page }) => {
        await page.goto("/this-route-does-not-exist");
        // The NotFound page should render something indicating the route is missing
        await expect(page.locator("body")).not.toBeEmpty();
        // URL should remain on the unknown path (no redirect)
        await expect(page).toHaveURL(/\/this-route-does-not-exist/);
    });
});

test.describe("Footer", () => {
    test("renders copyright notice", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText(/indigo dyeing/i)).toBeVisible();
    });
});
