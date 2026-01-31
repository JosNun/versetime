import { test, expect } from "@playwright/test";

test.describe("Translation Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("settings panel is visible by default", async ({ page }) => {
    const settingsPanel = page.locator("text=Settings").first();
    await expect(settingsPanel).toBeVisible();
  });

  test("translation selector is present with ESV and NIV options", async ({
    page,
  }) => {
    const translationSelect = page.getByLabel("Translation");
    await expect(translationSelect).toBeVisible();

    // Check that both options exist
    const options = translationSelect.locator("option");
    await expect(options).toHaveCount(2);

    const optionValues = await options.allTextContents();
    expect(optionValues).toContain("ESV (English Standard Version)");
    expect(optionValues).toContain("NIV (New International Version)");
  });

  test("translation selector defaults to ESV", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");
    await expect(translationSelect).toHaveValue("ESV");
  });

  test("can switch translation to NIV", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("NIV");
    await expect(translationSelect).toHaveValue("NIV");
  });

  test("can switch translation back to ESV", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");

    // Switch to NIV first
    await translationSelect.selectOption("NIV");
    await expect(translationSelect).toHaveValue("NIV");

    // Switch back to ESV
    await translationSelect.selectOption("ESV");
    await expect(translationSelect).toHaveValue("ESV");
  });
});

test.describe("Copyright Notice", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows ESV copyright when ESV is selected", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("ESV");

    const copyrightText = page.locator("text=Crossway");
    await expect(copyrightText).toBeVisible();
  });

  test("shows NIV copyright when NIV is selected", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("NIV");

    const copyrightText = page.locator("text=Biblica");
    await expect(copyrightText).toBeVisible();
  });

  test("copyright changes when translation is switched", async ({ page }) => {
    const translationSelect = page.getByLabel("Translation");

    // Start with ESV
    await translationSelect.selectOption("ESV");
    await expect(page.locator("text=Crossway")).toBeVisible();
    await expect(page.locator("text=Biblica")).not.toBeVisible();

    // Switch to NIV
    await translationSelect.selectOption("NIV");
    await expect(page.locator("text=Biblica")).toBeVisible();
    await expect(page.locator("text=Crossway")).not.toBeVisible();
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

    // Ensure ESV is selected
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("ESV");

    // Enter reference
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 3:16");

    // Click fetch
    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for the verse text to appear
    await expect(
      page.locator("text=For God so loved the world")
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Verse Fetching with NIV", () => {
  test("fetches verse from bolls.life API", async ({ page }) => {
    // Mock the bolls.life API response
    await page.route("**/bolls.life/get-text/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          pk: 123,
          translation: "NIV",
          book: 43,
          chapter: 3,
          verse: 16,
          text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        }),
      });
    });

    await page.goto("/");

    // Select NIV
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("NIV");

    // Enter reference
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 3:16");

    // Click fetch
    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for the verse text to appear (NIV uses "one and only Son")
    await expect(
      page.locator("text=one and only Son")
    ).toBeVisible({ timeout: 5000 });
  });

  test("fetches verse range from bolls.life API", async ({ page }) => {
    let requestCount = 0;

    // Mock the bolls.life API response for multiple verses
    await page.route("**/bolls.life/get-text/**", async (route) => {
      requestCount++;
      const url = route.request().url();

      // Parse verse number from URL
      const verseMatch = url.match(/\/(\d+)\/$/);
      const verse = verseMatch ? parseInt(verseMatch[1]) : 16;

      const verses: Record<number, string> = {
        16: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        17: "For God did not send his Son into the world to condemn the world, but to save the world through him.",
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          pk: 100 + verse,
          translation: "NIV",
          book: 43,
          chapter: 3,
          verse: verse,
          text: verses[verse] || "Test verse",
        }),
      });
    });

    await page.goto("/");

    // Select NIV
    const translationSelect = page.getByLabel("Translation");
    await translationSelect.selectOption("NIV");

    // Enter verse range
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 3:16-17");

    // Click fetch
    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for both verses to appear
    await expect(
      page.locator("text=one and only Son")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("text=condemn the world")
    ).toBeVisible({ timeout: 5000 });

    // Verify that 2 API requests were made (one per verse)
    expect(requestCount).toBe(2);
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

test.describe("UI Layout", () => {
  test("countdown timer input is present", async ({ page }) => {
    await page.goto("/");

    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible();
  });

  test("translation selector appears before reference input", async ({
    page,
  }) => {
    await page.goto("/");

    // Get the bounding boxes to verify order
    const translationSelect = page.getByLabel("Translation");
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');

    const selectBox = await translationSelect.boundingBox();
    const inputBox = await referenceInput.boundingBox();

    expect(selectBox).not.toBeNull();
    expect(inputBox).not.toBeNull();

    // Translation selector should be above (smaller Y) the reference input
    expect(selectBox!.y).toBeLessThan(inputBox!.y);
  });
});
