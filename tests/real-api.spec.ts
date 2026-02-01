import { test, expect } from "@playwright/test";

// These tests run against the real bolls.life API to verify
// our header removal and verse range functionality works correctly
test.describe("Real API Tests - Header Removal", () => {
  test("removes headers from verses with section titles", async ({ page }) => {
    await page.goto("/");

    // Select NIV translation
    const translationSelect = page.locator("select").first();
    await translationSelect.selectOption("NIV");

    // Test Romans 8:28 which has "More Than Conquerors" header
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("Romans 8:28");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for the verse text to appear
    await expect(
      page.locator("text=according to his purpose")
    ).toBeVisible({ timeout: 10000 });

    // Verify the header "More Than Conquerors" is NOT visible
    await expect(
      page.locator("text=More Than Conquerors")
    ).not.toBeVisible();
  });

  test("removes headers from John 1:1 with 'The Word Became Flesh' header", async ({ page }) => {
    await page.goto("/");

    // Select NIV translation
    const translationSelect = page.locator("select").first();
    await translationSelect.selectOption("NIV");

    // Test John 1:1 which has "The Word Became Flesh" header
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 1:1");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for the verse text to appear
    await expect(
      page.locator("text=In the beginning was the Word")
    ).toBeVisible({ timeout: 10000 });

    // Verify the header "The Word Became Flesh" is NOT visible
    await expect(
      page.locator("text=The Word Became Flesh")
    ).not.toBeVisible();
  });

  test("handles verse ranges correctly with headers - Romans 8:27-28", async ({ page }) => {
    await page.goto("/");

    // Select NIV translation
    const translationSelect = page.locator("select").first();
    await translationSelect.selectOption("NIV");

    // Test Romans 8:27-28 where verse 28 has a header
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("Romans 8:27-28");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for both verses to appear
    await expect(
      page.locator("text=Spirit intercedes for the saints")
    ).toBeVisible({ timeout: 10000 });
    
    await expect(
      page.locator("text=according to his purpose")
    ).toBeVisible({ timeout: 10000 });

    // Verify the header is removed from verse 28
    await expect(
      page.locator("text=More Than Conquerors")
    ).not.toBeVisible();
  });

  test("handles verse ranges without headers correctly", async ({ page }) => {
    await page.goto("/");

    // Select NIV translation
    const translationSelect = page.locator("select").first();
    await translationSelect.selectOption("NIV");

    // Test John 3:16-17 which should not have headers
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("John 3:16-17");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // Wait for both verses to appear
    await expect(
      page.locator("text=For God so loved the world")
    ).toBeVisible({ timeout: 10000 });
    
    await expect(
      page.locator("text=For God did not send his Son")
    ).toBeVisible({ timeout: 10000 });
  });

  test("verse ranges join correctly with spaces", async ({ page }) => {
    await page.goto("/");

    // Select NIV translation  
    const translationSelect = page.locator("select").first();
    await translationSelect.selectOption("NIV");

    // Test a short verse range
    const referenceInput = page.locator('input[placeholder*="John 3:16"]');
    await referenceInput.fill("1 John 4:7-8");

    const fetchButton = page.locator('button:has-text("Fetch")');
    await fetchButton.click();

    // The verses should be joined with spaces, creating a cohesive text
    await expect(
      page.locator("text=Dear friends, let us love one another")
    ).toBeVisible({ timeout: 10000 });

    // Verify both verses are present in the joined text
    await expect(
      page.locator("text=Whoever does not love does not know God")
    ).toBeVisible({ timeout: 10000 });
  });
});