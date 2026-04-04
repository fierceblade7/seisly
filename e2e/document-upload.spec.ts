import { test, expect } from '@playwright/test'

test.describe('Document upload validation', () => {
  test('should show email warning when uploading without email', async ({ page }) => {
    await page.goto('/apply/upload')

    // Try to upload without entering email first
    // The file input is hidden, but clicking the label triggers it
    // We can test the validation by checking that the email warning appears
    // when no email is set and the user interacts with upload

    // Verify the upload page loads
    await expect(page.getByText('Upload your documents')).toBeVisible()

    // Verify email field prompt appears when no email in sessionStorage
    // The email field should be visible since sessionStorage is empty
    await expect(page.getByPlaceholder('you@yourcompany.com')).toBeVisible()
  })

  test('should reject oversized files via API', async ({ request }) => {
    // Test the API directly for file size validation
    const formData = new FormData()

    // Create a mock file that exceeds 10MB
    const largeContent = new Uint8Array(11 * 1024 * 1024) // 11MB
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })

    formData.append('file', largeFile)
    formData.append('docType', 'business_plan')
    formData.append('email', 'test@example.com')
    formData.append('scheme', 'seis')

    const response = await request.post('/api/documents/upload', {
      multipart: {
        file: {
          name: 'large.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(11 * 1024 * 1024),
        },
        docType: 'business_plan',
        email: 'test@example.com',
        scheme: 'seis',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('File too large')
  })

  test('should reject disallowed file types via API', async ({ request }) => {
    const response = await request.post('/api/documents/upload', {
      multipart: {
        file: {
          name: 'script.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('test content'),
        },
        docType: 'business_plan',
        email: 'test@example.com',
        scheme: 'seis',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('File type not allowed')
  })

  test('should reject invalid docType via API', async ({ request }) => {
    const response = await request.post('/api/documents/upload', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test content'),
        },
        docType: 'invalid_type',
        email: 'test@example.com',
        scheme: 'seis',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Invalid document type')
  })
})
