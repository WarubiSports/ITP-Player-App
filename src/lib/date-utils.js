/**
 * Date utility functions that handle timezone conversions for players in Central European Time
 */

/**
 * Get today's date in YYYY-MM-DD format in the player's local timezone
 * @param {string} timezone - The timezone (defaults to 'Europe/Berlin' for CET/CEST)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getLocalDate(timezone = 'Europe/Berlin') {
    const date = new Date();

    // Convert to local timezone string using en-CA locale which gives YYYY-MM-DD format
    const localDateStr = date.toLocaleDateString('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return localDateStr;
}

/**
 * Format a date string for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';

    // Parse the date as local date (not UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get date N days ago in YYYY-MM-DD format
 * @param {number} daysAgo - Number of days to go back
 * @param {string} timezone - The timezone (defaults to 'Europe/Berlin' for CET/CEST)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getDateDaysAgo(daysAgo, timezone = 'Europe/Berlin') {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return date.toLocaleDateString('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Check if a date string is today in the player's timezone
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timezone - The timezone (defaults to 'Europe/Berlin' for CET/CEST)
 * @returns {boolean} True if the date is today
 */
export function isToday(dateStr, timezone = 'Europe/Berlin') {
    return dateStr === getLocalDate(timezone);
}

/**
 * Check if a date string is within the last N days
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} days - Number of days to check
 * @param {string} timezone - The timezone (defaults to 'Europe/Berlin' for CET/CEST)
 * @returns {boolean} True if the date is within the last N days
 */
export function isWithinLastNDays(dateStr, days, timezone = 'Europe/Berlin') {
    const cutoffDate = getDateDaysAgo(days, timezone);
    return dateStr >= cutoffDate;
}
