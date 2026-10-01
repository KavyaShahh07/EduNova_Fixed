/**
 * EduNova Date Normalization Utility
 * Safely converts any date format (YYYY-MM-DD, DD-MM-YYYY, ISO strings, Date objects)
 * to standard 'YYYY-MM-DD' for accurate calendar matching.
 */

export const normalizeDateStr = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const raw = dateVal.trim().split('T')[0];
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // DD-MM-YYYY or DD/MM/YYYY
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw)) {
      const parts = raw.split(/[-/]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (e) {
    // fallback
  }
  return String(dateVal).split('T')[0];
};

export default normalizeDateStr;
