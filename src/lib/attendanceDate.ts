/**
 * Returns today's attendance date based on India time.
 *
 * We store the attendance "day" as UTC midnight representing
 * the calendar date in Asia/Kolkata.
 *
 * Example:
 * India date: 2026-08-06
 * Stored date: 2026-08-06T00:00:00.000Z
 */
export function getTodayAttendanceDate(): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const day = Number(
    parts.find((part) => part.type === "day")?.value
  );

  return new Date(Date.UTC(year, month - 1, day));
}