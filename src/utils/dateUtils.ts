/**
 * Centralized Date & Time Utilities
 * Always operates in user's LOCAL timezone (e.g., Cambodia UTC+7) to prevent UTC date shift bugs around midnight.
 */

/**
 * Returns 'YYYY-MM-DD' formatted date in user's local timezone.
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns 'HH:mm' formatted time in 24-hour local time.
 */
export const getLocalTimeString = (d: Date = new Date()): string => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formats 'YYYY-MM-DD' to user friendly 'DD Mon YYYY' (e.g., '06 Aug 2026').
 */
export const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = String(parseInt(parts[2], 10)).padStart(2, '0');
    return `${d} ${months[m] || ''} ${y}`;
  }
  return dateStr;
};

/**
 * Formats 'HH:mm' to 12-hour AM/PM format (e.g., '12:50 AM').
 */
export const formatTime12 = (timeStr?: string): string => {
  const raw = timeStr || '12:00';
  const parts = raw.split(':');
  if (parts.length < 2) return '12:00 PM';
  let h = parseInt(parts[0], 10);
  const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
  if (isNaN(h)) return '12:00 PM';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
};

/**
 * Accurately parses 'YYYY-MM-DD' into a local Date object.
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};
