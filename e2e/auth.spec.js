import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete registration and login flow', async ({ page }) => {
    // Generate unique email for this test run
    const timestamp = Date.now();
    const testEmail = `e2etest${timestamp}@example.com`;
    const testPassword = 'TestPassword123';
    const testName = 'E2E Test User';

    // Navigate to home page
    await page.goto('/');
    
    // Click "Get Started" or similar button to go to registration
    // Adjust selector based on actual app structure
    const getStartedButton = page.locator('text=/get started/i').first();
    if (await getStartedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await getStartedButton.click();
    } else {
      // If no "Get Started" button, navigate directly to register
      await page.goto('/register');
    }

    // Wait for registration form
    await expect(page).toHaveURL(/register/, { timeout: 10000 });

    // Fill registration form
    await page.fill('input[name="name"], input[placeholder*="name" i]', testName);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);

    // Submit registration form
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign up")');

    // After successful registration, should redirect to dashboard
    await expect(page).toHaveURL(/dashboard|tasks/, { timeout: 15000 });

    // Verify we're logged in - check for user-specific elements
    const dashboardIndicator = page.locator('text=/dashboard|tasks|welcome/i').first();
    await expect(dashboardIndicator).toBeVisible({ timeout: 5000 });

    // Logout
    const logoutButton = page.locator('text=/logout|sign out/i').first();
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();
      
      // Verify we're logged out - should redirect to login or home
      await expect(page).toHaveURL(/login|^\/$/, { timeout: 10000 });
    }

    // Now test login with the created account
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    // Should be back in dashboard after login
    await expect(page).toHaveURL(/dashboard|tasks/, { timeout: 15000 });
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"], input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    // Should show error message or stay on login page
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });
});
