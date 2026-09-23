import { test, expect } from '@playwright/test'

test.describe('Discovery Feature E2E Tests', () => {
  test('renders discovery module overview and platform badges', async ({ page }) => {
    await page.goto('/discovery')

    await expect(page.getByRole('heading', { name: 'Descoberta Multiplataforma' })).toBeVisible()
    await expect(page.getByText('TikTok · Instagram · YouTube')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Módulo de Descoberta' })).toBeVisible()
  })
})
