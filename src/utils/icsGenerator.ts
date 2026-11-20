import { ReservationLeadMeta, RoomRecord } from '../types/facility';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatIsoDate(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

export function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function daysInMonthUtc(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function calculateReservationOpenDate(
  practiceDateIso: string,
  meta: ReservationLeadMeta,
  todayIso = new Date().toISOString().slice(0, 10)
): { openDateIso: string; ruleSummary: string } {
  const parsed = parseIsoDateParts(practiceDateIso);
  if (!parsed) {
    return { openDateIso: todayIso, ruleSummary: meta.releaseDayNote };
  }

  if (meta.releaseType === 'instant') {
    return {
      openDateIso: todayIso,
      ruleSummary: `${meta.releaseDayNote}（WEBでいつでも確認・予約可能）`,
    };
  }

  if (meta.releaseType === 'rolling_days') {
    const days = meta.daysBefore ?? 1;
    const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
    d.setUTCDate(d.getUTCDate() - days);
    const openDateIso = formatIsoDate(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    );
    return {
      openDateIso: openDateIso < todayIso ? todayIso : openDateIso,
      ruleSummary: meta.releaseDayNote,
    };
  }

  const months = meta.monthsAhead ?? 3;
  const rawMonthIndex = parsed.month - 1 - months;
  const targetDate = new Date(Date.UTC(parsed.year, rawMonthIndex, 1));
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth0 = targetDate.getUTCMonth();

  if (meta.releaseType === 'first_of_month') {
    const openDateIso = formatIsoDate(targetYear, targetMonth0, 1);
    return {
      openDateIso: openDateIso < todayIso ? todayIso : openDateIso,
      ruleSummary: meta.releaseDayNote,
    };
  }

  // rolling_months: clamp day to target month's last day (e.g. Aug 31 -> May 31, May 31 -> Feb 28/29)
  const clampedDay = Math.min(parsed.day, daysInMonthUtc(targetYear, targetMonth0));
  const openDateIso = formatIsoDate(targetYear, targetMonth0, clampedDay);
  return {
    openDateIso: openDateIso < todayIso ? todayIso : openDateIso,
    ruleSummary: meta.releaseDayNote,
  };
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function nextDayCompact(isoDate: string): string {
  const parsed = parseIsoDateParts(isoDate);
  if (!parsed) return isoDate.replace(/-/g, '');
  const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1));
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

export function buildBookingReminderIcs(
  room: RoomRecord,
  practiceDateIso: string,
  openDateIso: string,
  pageUrl = ''
): string {
  const dtStart = openDateIso.replace(/-/g, '');
  const dtEnd = nextDayCompact(openDateIso);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const uid = `hakosagashi-${room.id}-${dtStart}@hakosagashi.local`;

  const summary = `【予約確認】${room.facilityName} ${room.roomName}（練習予定: ${practiceDateIso}）`;
  const descriptionLines = [
    `練習予定日: ${practiceDateIso}`,
    `施設・部屋: ${room.facilityName} / ${room.roomName}`,
    `予約ルール: ${room.reservationRule}`,
    `登録要件: ${room.registrationRule}`,
    `注意事項: ${room.cautionsSummary}`,
    `公式予約URL: ${room.officialBookingUrl}`,
  ];
  if (pageUrl) {
    descriptionLines.push(`HakoSagashi詳細: ${pageUrl}`);
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HakoSagashi//Practice Room Reminder//JA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(`${room.facilityName}（${room.address}）`)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
