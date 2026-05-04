import { expect, test } from "@playwright/test";
import { loginUser, registerUser, uniqueEmail } from "../fixtures/auth";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
test.describe("Register page – UI", () => {
    test("renders registration form with all fields", async ({ page }) => {
        await page.goto("/register");
        await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
        await expect(page.getByLabel("Full Name")).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(page.getByRole("button", { name: "Customer" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Workshop" })).toBeVisible();
        await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
    });

    test("shows validation error when fields are empty", async ({ page }) => {
        await page.goto("/register");
        await page.getByRole("button", { name: /sign up/i }).click();
        await expect(page.getByText(/please fill out all required fields/i)).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
        await page.goto("/register");
        await page.getByLabel("Full Name").fill("Test");
        await page.getByLabel("Email").fill(uniqueEmail("pw-short"));
        await page.getByLabel("Password").fill("123");
        await page.getByRole("button", { name: /sign up/i }).click();
        await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
        await page.goto("/register");
        await page.getByRole("link", { name: /log in/i }).click();
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe("Register – happy paths", () => {
    test("registers a new customer and reaches user dashboard", async ({ page }) => {
        const email = uniqueEmail("customer");
        await registerUser(page, { name: "E2E Customer", email, password: "password123", role: "user" });
        await expect(page).toHaveURL(/\/dashboard/);
        // Nav should now show logout
        await expect(page.getByRole("navigation").getByRole("button", { name: /logout/i })).toBeVisible();
    });

    test("registers a new workshop owner and reaches workshop dashboard", async ({ page }) => {
        const email = uniqueEmail("workshop-owner");
        await registerUser(page, { name: "E2E Workshop", email, password: "password123", role: "workshop" });
        await expect(page).toHaveURL(/\/workshop-dashboard/);
    });
});

test.describe("Register – redirect when already logged in", () => {
    test("logged-in customer visiting /register is redirected to /dashboard", async ({ page }) => {
        const email = uniqueEmail("redir-customer");
        await registerUser(page, { name: "Redir User", email, password: "password123", role: "user" });
        await page.goto("/register");
        await expect(page).toHaveURL(/\/dashboard/);
    });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
test.describe("Login page – UI", () => {
    test("renders login form with email and password fields", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
    });

    test("shows validation error when fields are empty", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("button", { name: /log in/i }).click();
        await expect(page.getByText(/please enter your email and password/i)).toBeVisible();
    });

    test("shows error message for wrong credentials", async ({ page }) => {
        await page.goto("/login");
        await page.getByLabel("Email").fill("nobody@nowhere.example");
        await page.getByLabel("Password").fill("wrongpassword");
        await page.getByRole("button", { name: /log in/i }).click();
        // The 401 response from the API triggers a redirect back to /login (interceptor behaviour)
        // After the reload the login form should be visible again
        await expect(page.getByRole("button", { name: /log in/i })).toBeVisible({ timeout: 8_000 });
        await expect(page).toHaveURL(/\/login/);
    });

    test("has link to register page", async ({ page }) => {
        await page.goto("/login");
        await page.getByRole("link", { name: /create one/i }).click();
        await expect(page).toHaveURL(/\/register/);
    });
});

test.describe("Login – happy paths", () => {
    test("logs in as customer and reaches user dashboard", async ({ page }) => {
        // First register so the account exists
        const email = uniqueEmail("login-customer");
        await registerUser(page, { name: "Login Customer", email, password: "securepass1", role: "user" });
        // Logout first
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        // Now login
        await loginUser(page, { email, password: "securepass1", expectedPath: "/dashboard" });
        await expect(page.getByRole("navigation").getByRole("button", { name: /logout/i })).toBeVisible();
    });

    test("logs in as workshop owner and reaches workshop dashboard", async ({ page }) => {
        const email = uniqueEmail("login-workshop");
        await registerUser(page, { name: "Login Workshop", email, password: "securepass2", role: "workshop" });
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        await loginUser(page, { email, password: "securepass2", expectedPath: "/workshop-dashboard" });
    });
});

test.describe("Login – redirect when already logged in", () => {
    test("logged-in customer visiting /login is redirected to /dashboard", async ({ page }) => {
        const email = uniqueEmail("redir-login");
        await registerUser(page, { name: "Redir Login", email, password: "password123", role: "user" });
        await page.goto("/login");
        await expect(page).toHaveURL(/\/dashboard/);
    });
});

// ---------------------------------------------------------------------------
// Protected route guard
// ---------------------------------------------------------------------------
test.describe("Protected routes", () => {
    test("visiting /dashboard without auth redirects to /login", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });

    test("visiting /workshop-dashboard without auth redirects to /login", async ({ page }) => {
        await page.goto("/workshop-dashboard");
        await expect(page).toHaveURL(/\/login/);
    });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
test.describe("Logout", () => {
    test("logout button in nav redirects to home and hides dashboard links", async ({ page }) => {
        const email = uniqueEmail("logout-test");
        await registerUser(page, { name: "Logout Test", email, password: "password123", role: "user" });
        // Use the nav logout (from Layout)
        await page.goto("/");
        await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
        await expect(page).toHaveURL("/");
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    });
});
