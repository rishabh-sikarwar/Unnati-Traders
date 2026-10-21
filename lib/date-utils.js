/**
 * Unnati Traders - Timezone-aware date utilities for Asia/Kolkata (IST).
 * 
 * IST is UTC+5:30 (offset of +330 minutes or +19,800,000 milliseconds).
 * Database timestamps are stored in UTC. 
 * To query for "Today" in IST, we must calculate the exact UTC timestamps
 * that correspond to 00:00:00.000 IST and 23:59:59.999 IST.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 in milliseconds (19,800,000)

/**
 * Converts IST year, month (0-indexed), date, and optional time into a UTC Date object.
 */
export function getUtcFromIst(year, month, date, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  return new Date(Date.UTC(year, month, date, hours, minutes, seconds, ms) - IST_OFFSET_MS);
}

/**
 * Returns the current date components in Asia/Kolkata (IST).
 */
export function getIstNow() {
  const nowUtc = new Date();
  const istTime = new Date(nowUtc.getTime() + IST_OFFSET_MS);
  return {
    year: istTime.getUTCFullYear(),
    month: istTime.getUTCMonth(), // 0-11
    date: istTime.getUTCDate(),   // 1-31
    hours: istTime.getUTCHours(),
    minutes: istTime.getUTCMinutes(),
    seconds: istTime.getUTCSeconds(),
    dateObj: istTime,
  };
}

/**
 * Builds the Prisma where { createdAt: { gte, lte } } filter for predefined & custom ranges in IST.
 * 
 * @param {string} dateFilter - "today" | "yesterday" | "this_month" | "last_month" | "custom" | "all"
 * @param {string} [customStart] - "YYYY-MM-DD"
 * @param {string} [customEnd] - "YYYY-MM-DD"
 * @returns {{ gte: Date, lte: Date } | null}
 */
export function getIstDateFilter(dateFilter, customStart, customEnd) {
  const { year, month, date } = getIstNow();

  switch (dateFilter) {
    case "today": {
      const gte = getUtcFromIst(year, month, date, 0, 0, 0, 0);
      const lte = getUtcFromIst(year, month, date, 23, 59, 59, 999);
      return { gte, lte };
    }

    case "yesterday": {
      const yesterday = new Date(Date.UTC(year, month, date - 1));
      const yY = yesterday.getUTCFullYear();
      const yM = yesterday.getUTCMonth();
      const yD = yesterday.getUTCDate();
      const gte = getUtcFromIst(yY, yM, yD, 0, 0, 0, 0);
      const lte = getUtcFromIst(yY, yM, yD, 23, 59, 59, 999);
      return { gte, lte };
    }

    case "this_month": {
      // From 1st of current month at 00:00:00 IST to end of today at 23:59:59.999 IST
      const gte = getUtcFromIst(year, month, 1, 0, 0, 0, 0);
      const lte = getUtcFromIst(year, month, date, 23, 59, 59, 999);
      return { gte, lte };
    }

    case "last_month": {
      // Month prior
      const prevMonth = new Date(Date.UTC(year, month - 1, 1));
      const pY = prevMonth.getUTCFullYear();
      const pM = prevMonth.getUTCMonth();
      // Last day of that month is day 0 of current month
      const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

      const gte = getUtcFromIst(pY, pM, 1, 0, 0, 0, 0);
      const lte = getUtcFromIst(pY, pM, lastDayOfPrevMonth, 23, 59, 59, 999);
      return { gte, lte };
    }

    case "custom": {
      if (!customStart || !customEnd) return null;
      const [sY, sM, sD] = customStart.split("-").map(Number);
      const [eY, eM, eD] = customEnd.split("-").map(Number);
      if (!sY || !sM || !sD || !eY || !eM || !eD) return null;

      const gte = getUtcFromIst(sY, sM - 1, sD, 0, 0, 0, 0);
      const lte = getUtcFromIst(eY, eM - 1, eD, 23, 59, 59, 999);
      return { gte, lte };
    }

    default:
      return null;
  }
}
