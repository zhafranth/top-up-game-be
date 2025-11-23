/**
 * Format a Date object into a string with the given pattern.
 * @param {Date} date
 * @param {string} pattern - e.g. 'YYYY-MM-DD HH:mm:ss'
 * @returns {string}
 */
function formatDate(date, pattern = "YYYY-MM-DD HH:mm:ss") {
  if (!date || !(date instanceof Date)) return "";

  const pad = (n) => (n < 10 ? "0" + n : n);

  const replacements = {
    YYYY: date.getFullYear(),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return pattern.replace(
    /YYYY|MM|DD|HH|mm|ss/g,
    (match) => replacements[match]
  );
}

/**
 * Get the current UTC date string in ISO format.
 * @returns {string}
 */
function getCurrentUTCISOString() {
  return new Date().toISOString();
}

/**
 * Parse an ISO date string into a Date object.
 * @param {string} isoString
 * @returns {Date|null}
 */
function parseISOString(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
}

module.exports = {
  formatDate,
  getCurrentUTCISOString,
  parseISOString,
};
