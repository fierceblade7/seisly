/**
 * Escapes HTML special characters in a string to prevent XSS
 * when interpolating user-supplied values into HTML email templates.
 */
export function sanitiseHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
