
import { test, expect } from '@playwright/test';

// END-TO-END TESTING
// This file simulates a real user journey in a browser environment.
// It verifies that the application flow (Dashboard -> Detail) works as expected.

test.describe('OT Sentinel App Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the local application (assumed running on localhost:3000)
    await page.goto('http://localhost:3000');
  });

  test('should load the dashboard and display machines', async ({ page }) => {
    // Verify title exists
    await expect(page.getByText('OT SENTINEL')).toBeVisible();
    await expect(page.getByText('Production Line Overview')).toBeVisible();

    // Verify at least one machine column is present (checking for the column testid or class)
    // Note: data-testid is best practice
    const machineColumns = page.getByTestId('machine-column');
    await expect(machineColumns.first()).toBeVisible();
  });

  test('should navigate to machine detail view on click', async ({ page }) => {
    // Find the first machine name to verify later
    const firstMachineNameElement = page.locator('[data-testid="machine-column"] span.text-xs.font-bold').first();
    const machineName = await firstMachineNameElement.textContent();

    // Click on the header of the first machine column
    // The header is the clickable div containing the name
    const clickableHeader = page.locator('[data-testid="machine-column"] > div.cursor-pointer').first();
    await clickableHeader.click();

    // Check if view changed
    // We expect the Dashboard title to be gone or the Back button to appear
    await expect(page.getByText('Back to Dashboard')).toBeVisible();
    
    // Verify the specific machine name is shown in the detail header
    if (machineName) {
        await expect(page.locator('h2', { hasText: machineName })).toBeVisible();
    }
  });

  test('should allow navigation back to dashboard', async ({ page }) => {
    // Go to detail
    await page.locator('[data-testid="machine-column"] > div.cursor-pointer').first().click();
    
    // Click back
    await page.getByText('Back to Dashboard').click();

    // Verify we are back
    await expect(page.getByText('Production Line Overview')).toBeVisible();
  });
});
