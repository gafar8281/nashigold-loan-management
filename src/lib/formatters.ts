export function formatCurrency(amount: number): string {
  return 'SAR ' + amount.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return formatDateISO(new Date())
}
