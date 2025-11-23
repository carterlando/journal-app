/**
 * Memory Entry Search Utilities
 * 
 * Cascading search algorithm to find meaningful "Remember this day" entries:
 * 1. Exact day match (same day/month, earlier year)
 * 2. ±7 days match (same week range, earlier year)
 * 3. Same month match (earlier year)
 * 4. Same year match (earlier year)
 * 5. Random past entry
 */

/**
 * Find a memory entry using cascading search
 * @param {Array} entries - All available entries
 * @param {Date} referenceDate - Date to search from (usually today)
 * @returns {Object|null} - Found entry or null
 */
export const findMemoryEntry = (entries, referenceDate) => {
  if (entries.length === 0) return null;

  const todayMidnight = new Date(referenceDate);
  todayMidnight.setHours(0, 0, 0, 0);

  // Filter to only past entries
  const pastEntries = entries.filter(entry => {
    const entryDate = new Date(entry.recordedAt);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate < todayMidnight;
  });

  if (pastEntries.length === 0) return null;

  // Search back 10 years (120 months)
  for (let monthsBack = 0; monthsBack < 120; monthsBack++) {
    const targetDate = new Date(referenceDate);
    targetDate.setMonth(targetDate.getMonth() - monthsBack);

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    // 1. Exact day match
    const exactDayMatches = pastEntries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      return entryDate.getFullYear() < targetYear &&
             entryDate.getMonth() + 1 === targetMonth &&
             entryDate.getDate() === targetDay;
    });

    if (exactDayMatches.length > 0) {
      return getRandomEntry(exactDayMatches);
    }

    // 2. ±7 days match
    const weekRangeMatches = pastEntries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      const entryYear = entryDate.getFullYear();
      
      if (entryYear >= targetYear) return false;

      const targetDateInEntryYear = new Date(entryYear, targetMonth - 1, targetDay);
      const dayDiff = Math.abs(
        Math.floor((entryDate.getTime() - targetDateInEntryYear.getTime()) / (1000 * 60 * 60 * 24))
      );

      return dayDiff <= 7;
    });

    if (weekRangeMatches.length > 0) {
      return getClosestEntry(weekRangeMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
    }

    // 3. Same month match
    const sameMonthMatches = pastEntries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      return entryDate.getFullYear() < targetYear &&
             entryDate.getMonth() + 1 === targetMonth;
    });

    if (sameMonthMatches.length > 0) {
      return getClosestEntry(sameMonthMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
    }

    // 4. Same year match
    const sameYearMatches = pastEntries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      return entryDate.getFullYear() < targetYear;
    });

    if (sameYearMatches.length > 0) {
      return getClosestEntry(sameYearMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
    }
  }

  // 5. Random fallback
  return getRandomEntry(pastEntries);
};

/**
 * Get random entry from array
 */
const getRandomEntry = (entries) => {
  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
};

/**
 * Get entry closest to target date
 */
const getClosestEntry = (entries, targetDate) => {
  return entries.reduce((closest, entry) => {
    const entryDate = new Date(entry.recordedAt);
    const closestDate = new Date(closest.recordedAt);
    
    const entryDiff = Math.abs(entryDate.getTime() - targetDate.getTime());
    const closestDiff = Math.abs(closestDate.getTime() - targetDate.getTime());
    
    return entryDiff < closestDiff ? entry : closest;
  });
};