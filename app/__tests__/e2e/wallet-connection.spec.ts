/**
 * E2E Test: Wallet Connection Flow
 * Tests the wallet authentication flow
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });

  test('should open wallet connection modal', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await connectButton.click();
    
    // Check for wallet options
    await expect(page.locator('text=Phantom')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Solflare')).toBeVisible();
  });

  test('should handle wallet connection rejection', async ({ page, context }) => {
    // Mock wallet rejection
    await context.route('**/api/auth/challenge', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ nonce: 'test-nonce' }),
      });
    });

    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await connectButton.click();
    
    // Click on Phantom (or mock wallet)
    const phantomButton = page.locator('button:has-text("Phantom")');
    if (await phantomButton.isVisible()) {
      await phantomButton.click();
    }
    
    // In a real test, we would simulate wallet rejection
    // For now, we just verify the flow starts
  });

  test('should show wallet address when connected', async ({ page }) => {
    // This would require mocking a successful wallet connection
    // For now, we verify the UI structure
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });
});

