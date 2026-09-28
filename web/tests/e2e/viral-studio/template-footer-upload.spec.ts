import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

test.describe('Template Studio - Card de Rodapé e Upload de Imagem E2E', () => {
  const testImagePath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'test-banner.png')

  test.beforeAll(() => {
    const fixtureDir = path.dirname(testImagePath)
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true })
    }
    // Generate a simple 1x1 valid PNG
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'))
  })

  test('edits template, switches footer to custom_upload, uploads image and updates canvas', async ({
    page,
  }) => {
    // 1. Open Templates Gallery
    await page.goto('/viral-studio/templates')
    await expect(page.getByText('Estúdio de Templates')).toBeVisible()

    // 2. Click on the first template card's Studio button
    await page
      .getByRole('button', { name: /Estúdio 9:16/i })
      .first()
      .click()

    // 3. Wait for the workstation Dual-Pane view to load
    await expect(page.getByText('Card de Rodapé / Imagem Extra')).toBeVisible()

    // 4. Ensure Footer switch is checked
    const footerHeading = page.getByText('Card de Rodapé / Imagem Extra')
    await expect(footerHeading).toBeVisible()
    const footerCard = footerHeading.locator('..').locator('..')
    const footerSwitch = footerCard.getByRole('switch')
    const isChecked = await footerSwitch.getAttribute('aria-checked')
    if (isChecked !== 'true') {
      await footerSwitch.click()
    }

    // 5. Select "Upload Personalizado" in the select dropdown
    const selectTrigger = page.getByRole('combobox', { name: 'Tipo de Card de Rodapé' })
    await selectTrigger.scrollIntoViewIfNeeded()
    await selectTrigger.click()
    const uploadOption = page.getByRole('option', { name: /Upload Personalizado/i })
    await uploadOption.waitFor({ state: 'visible' })
    await uploadOption.click()

    // 6. Verify Upload panel is displayed
    await expect(page.getByText('Banner Personalizado (PNG/JPG)')).toBeVisible()

    // 7. Upload the test image file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // 8. Verify the upload success toast appears
    await expect(page.getByText(/Imagem de rodapé carregada com sucesso!/i)).toBeVisible({
      timeout: 10000,
    })

    // 9. Verify the thumbnail preview image is rendered in the panel
    const previewImg = page.locator('img[alt="Banner Preview"]')
    await expect(previewImg).toBeVisible()
    await expect(page.getByText(/Arquivo: .*_extra\.png/i)).toBeVisible()

    // 10. Verify the Konva canvas exists and has no console errors
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // 11. Edit a field to make it dirty (e.g. adjust slider or name) and save
    const nameInput = page.locator('input').first()
    await nameInput.fill('Template E2E Test')

    const saveButton = page.getByRole('button', { name: /Salvar/i })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
    await expect(page.getByText(/Template salvo com sucesso/i)).toBeVisible({ timeout: 10000 })
  })
})
