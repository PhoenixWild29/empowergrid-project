/**
 * E2E Test: Projects Page
 * Tests project listing, filtering, and details
 */

import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('should display project list', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 10000 });
    
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter projects by category', async ({ page }) => {
    // Wait for filters to be available
    await page.waitForSelector('button:has-text("Solar")', { timeout: 5000 });
    
    const solarFilter = page.locator('button:has-text("Solar")');
    await solarFilter.click();
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify URL contains filter
    const url = page.url();
    expect(url).toContain('category');
  });

  test('should search for projects', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('solar');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results
    const url = page.url();
    expect(url).toContain('search');
  });

  test('should navigate to project details', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 10000 });
    
    const firstProject = page.locator('[data-testid="project-card"]').first();
    await firstProject.click();
    
    // Wait for navigation
    await page.waitForURL(/.*projects\/.*/, { timeout: 5000 });
    
    // Check project details page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should paginate projects', async ({ page }) => {
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 10000 });
    
    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next")');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Verify URL changed
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toContain('page');
    }
  });
});

