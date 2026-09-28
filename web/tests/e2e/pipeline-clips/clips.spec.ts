import { test, expect } from '@playwright/test'

test.describe('Pipeline Clips Feature E2E Tests', () => {
  test('renders 9:16 clips pipeline view and badge', async ({ page }) => {
    await page.goto('/clips')

    await expect(
      page.getByRole('heading', { name: 'Cortes 9:16 (Pipeline Tradicional)' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pipeline de Cortes' })).toBeVisible()
  })
})
