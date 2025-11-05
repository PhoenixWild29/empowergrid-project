/**
 * E2E Test: Homepage
 * Tests the main landing page and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/EmpowerGRID/i);
    
    // Check main navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for key sections
    await expect(page.locator('text=Renewable Energy')).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    const projectsLink = page.locator('a[href*="projects"]').first();
    await projectsLink.click();
    
    await expect(page).toHaveURL(/.*projects/);
  });

  test('should display wallet connection button', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile menu is accessible
    const mobileMenu = page.locator('button[aria-label*="menu"]');
    await expect(mobileMenu).toBeVisible();
  });
});

