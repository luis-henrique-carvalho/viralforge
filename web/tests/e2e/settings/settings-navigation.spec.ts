import { test, expect } from '@playwright/test'

test.describe('Settings Feature E2E Tests', () => {
  test('renders settings dashboard and switches between configuration tabs', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: 'Configurações & Provedores' })).toBeVisible()
    await expect(page.getByText('Gerencie as credenciais de IA')).toBeVisible()

    // Switch to Modelos & IA
    await page
      .getByRole('navigation', { name: 'Abas de Configurações' })
      .getByRole('button', { name: /Modelos & IA/i })
      .click()
    await expect(page.getByText('Modelos de IA & Raciocínio')).toBeVisible()

    // Switch to Transcrição & Áudio
    await page
      .getByRole('navigation', { name: 'Abas de Configurações' })
      .getByRole('button', { name: /Transcrição & Áudio/i })
      .click()
    await expect(page.getByText('Provedores de Transcrição & Áudio')).toBeVisible()

    // Switch to Aceleração & Hardware
    await page
      .getByRole('navigation', { name: 'Abas de Configurações' })
      .getByRole('button', { name: /Aceleração & Hardware/i })
      .click()
    await expect(page.getByText('Aceleração de Hardware & Telemetria')).toBeVisible()
  })
})
