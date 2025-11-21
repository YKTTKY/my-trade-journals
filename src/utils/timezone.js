// Hong Kong Time Zone Helper
// Hong Kong is UTC+8
export const HK_OFFSET_MS = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

// Return a Date representing the current time in HK as an instant (UTC-based epoch shifted by +8h)
export const getHKTime = () => {
  const now = new Date()
  // Use epoch ms so this is independent of the host TZ
  return new Date(now.getTime() + HK_OFFSET_MS)
}

// Format a Date or timestamp (UTC or local) into a string suitable for <input type="datetime-local">
// The returned value is the Hong Kong local time representation (UTC+8) in YYYY-MM-DDTHH:mm
export const formatDateTimeLocal = (date) => {
  if (!date) return ''

  const d = (date instanceof Date) ? date : new Date(date)

  // Convert the instant to HK by adding the HK offset (relative to UTC epoch ms).
  // Then use UTC getters on the shifted Date so the values are deterministic independent of the host TZ.
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
export const parseHKInputToUTC = (localDateTimeStr) => {
  if (!localDateTimeStr) return null

  // Expect format YYYY-MM-DDTHH:mm (optionally seconds)
  const [datePart, timePart = '00:00'] = localDateTimeStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  // The UTC instant is the HK local date/time minus the HK offset
  // Date.UTC will normalize out-of-range fields (e.g., hour - 8 < 0)
  const utcMillis = Date.UTC(year, month - 1, day, hour - 8, minute, 0)
  return new Date(utcMillis).toISOString()
}

export const getDateTimeForInput = () => {
  // Return current time in HKT formatted for datetime-local
  return formatDateTimeLocal(new Date())
}
