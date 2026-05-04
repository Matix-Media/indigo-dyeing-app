import { Page, expect } from "@playwright/test";

/** Generates a unique email address to avoid conflicts between test runs. */
export function uniqueEmail(prefix = "user"): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@e2e-test.invalid`;
}

/** Registers a new account and lands on the appropriate dashboard. */
export async function registerUser(
    page: Page,
    opts: { name: string; email: string; password: string; role: "user" | "workshop" },
): Promise<void> {
    await page.goto("/register");
    await page.getByLabel("Full Name").fill(opts.name);
    await page.getByLabel("Email").fill(opts.email);
    await page.getByLabel("Password").fill(opts.password);

    if (opts.role === "workshop") {
        await page.getByRole("button", { name: "Workshop" }).click();
    }

    await page.getByRole("button", { name: /sign up/i }).click();

    const expectedPath = opts.role === "workshop" ? "/workshop-dashboard" : "/dashboard";
    await expect(page).toHaveURL(new RegExp(expectedPath));
}

/** Logs in with existing credentials and lands on the appropriate dashboard. */
export async function loginUser(
    page: Page,
    opts: { email: string; password: string; expectedPath?: string },
): Promise<void> {
    await page.goto("/login");
    await page.getByLabel("Email").fill(opts.email);
    await page.getByLabel("Password").fill(opts.password);
    await page.getByRole("button", { name: /log in/i }).click();

    if (opts.expectedPath) {
        await expect(page).toHaveURL(new RegExp(opts.expectedPath));
    }
}

/** Logs out via the nav button (on pages that use the Layout). */
export async function logoutUser(page: Page): Promise<void> {
    await page.getByRole("navigation").getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL("/");
}
