import { test, expect } from "@playwright/test";

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("settings panel is visible by default", async ({ page }) => {
    const settingsPanel = page.locator("text=Settings").first();
    await expect(settingsPanel).toBeVisible();
  });

  test("countdown timer input is present", async ({ page }) => {
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible();
  });

  test("shows ESV copyright", async ({ page }) => {
    await expect(page.locator("text=Crossway")).toBeVisible();
  });
});

test.describe("Verse Fetching with ESV", () => {
  test("fetches verse from ESV API", async ({ page }) => {
    // Mock the ESV API response
    await page.route("**/api.esv.org/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          canonical: "John 3:16",
          query: "John 3:16",
          passages: [
            "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
          ],
        }),
      });
    });

    await page.goto("/");

    // Enter reference
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 3:16");

    // Click fetch
    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // The sidebar previews the fetched verse right away
    const preview = page.getByTestId("verse-preview");
    await expect(preview).toContainText("John 3:16", { timeout: 5000 });
    await expect(preview).toContainText("For God so loved the world");
  });

  test("shows a message when the reference isn't found", async ({ page }) => {
    await page.route("**/api.esv.org/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ canonical: "", query: "Hezekiah 1:1", passages: [] }),
      });
    });

    await page.goto("/");

    await page.locator('input[placeholder*="John 3:16"]').fill("Hezekiah 1:1");
    await page.locator('button:has-text("Fetch")').click();

    await expect(page.getByRole("alert")).toContainText("Hezekiah 1:1");
    await expect(page.getByTestId("verse-preview")).toHaveCount(0);
  });
});

test.describe("Reference Input", () => {
  test("reference input is present", async ({ page }) => {
    await page.goto("/");

    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await expect(referenceInput).toBeVisible();
  });

  test("fetch button is present", async ({ page }) => {
    await page.goto("/");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await expect(fetchButton).toBeVisible();
  });

  test("can enter reference text", async ({ page }) => {
    await page.goto("/");

    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("Romans 8:28");

    await expect(referenceInput).toHaveValue("Romans 8:28");
  });
});
