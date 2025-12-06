// Hong Kong Time Zone Helper (TypeScript)
// Hong Kong is UTC+8
export const HK_OFFSET_MS: number = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

// Return a Date representing the current time in HK as an instant (UTC-based epoch shifted by +8h)
export const getHKTime = (): Date => {
  const now = new Date()
  return new Date(now.getTime() + HK_OFFSET_MS)
}

// Format a Date or timestamp (UTC or local) into a string suitable for <input type="datetime-local">
// The returned value is the Hong Kong local time representation (UTC+8) in YYYY-MM-DDTHH:mm
export const formatDateTimeLocal = (date?: Date | string | null): string => {
  if (!date) return ''

  const d = (date instanceof Date) ? date : new Date(date)
  const hkDate = new Date(d.getTime() + HK_OFFSET_MS)

  const year = hkDate.getUTCFullYear()
  const month = String(hkDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(hkDate.getUTCDate()).padStart(2, '0')
  const hours = String(hkDate.getUTCHours()).padStart(2, '0')
  const minutes = String(hkDate.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Parse an <input type="datetime-local"> value which represents a Hong Kong local time
// and convert it to an ISO UTC string suitable for storing in the database.
// Example: "2025-11-20T12:00" (HKT) -> "2025-11-20T04:00:00.000Z" (UTC)
export const parseHKInputToUTC = (localDateTimeStr?: string | null): string | null => {
  if (!localDateTimeStr) return null

  const [datePart, timePart = '00:00'] = localDateTimeStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  const utcMillis = Date.UTC(year, month - 1, day, hour - 8, minute, 0)
  return new Date(utcMillis).toISOString()
}

export const getDateTimeForInput = (): string => {
  return formatDateTimeLocal(new Date())
}
