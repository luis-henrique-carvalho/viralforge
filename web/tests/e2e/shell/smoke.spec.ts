import { test, expect } from '@playwright/test'

test.describe('ViralForge Shell E2E Smoke Tests', () => {
  test('redirects to /viral-studio and renders the main studio dashboard', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/.*\/viral-studio/)
    await expect(page.getByRole('heading', { name: 'Viral Content Studio' })).toBeVisible()
    await expect(page.getByText('ViralForge')).toBeVisible()
    await expect(page.getByText('v0.1.0 Beta')).toBeVisible()
  })

  test('navigates across sections using the sidebar', async ({ page }) => {
    await page.goto('/viral-studio')

    // Navigate to Descoberta
    await page.getByRole('link', { name: 'Descoberta' }).click()
    await expect(page).toHaveURL(/.*\/discovery/)
    await expect(page.getByRole('heading', { name: 'Descoberta Multiplataforma' })).toBeVisible()

    // Navigate to Configurações
    await page.getByRole('link', { name: 'Configurações' }).click()
    await expect(page).toHaveURL(/.*\/settings/)
    await expect(page.getByRole('heading', { name: 'Configurações & Provedores' })).toBeVisible()
  })
})
