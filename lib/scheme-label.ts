// Human-readable label for an application scheme. Used wherever the scheme
// is shown to founders (emails, dashboard cards) so we never display the
// raw "BOTH" enum value.
export function schemeLabel(scheme: string | null | undefined): string {
  switch (scheme) {
    case 'seis':
      return 'SEIS'
    case 'eis':
      return 'EIS'
    case 'both':
      return 'SEIS and EIS'
    default:
      return ''
  }
}
