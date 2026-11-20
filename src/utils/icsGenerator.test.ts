import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITY_ROOMS } from '../data/facilityRooms';
import { buildBookingReminderIcs, calculateReservationOpenDate } from './icsGenerator';

test('calculateReservationOpenDate resolves first_of_month and rolling_months dates properly', () => {
  const firstOfMonth = calculateReservationOpenDate(
    '2027-07-18',
    {
      releaseType: 'first_of_month',
      monthsAhead: 3,
      releaseDayNote: '利用日の3ヶ月前の毎月1日から受付開始',
    },
    '2026-11-19'
  );
  assert.equal(firstOfMonth.openDateIso, '2027-04-01');

  const rollingClamped = calculateReservationOpenDate(
    '2027-05-31',
    {
      releaseType: 'rolling_months',
      monthsAhead: 3,
      releaseDayNote: '利用日の3ヶ月前から予約開始',
    },
    '2026-11-19'
  );
  // May 31 minus 3 months -> Feb 28 (2027 is non-leap)
  assert.equal(rollingClamped.openDateIso, '2027-02-28');
});

test('buildBookingReminderIcs outputs valid RFC5545 VCALENDAR with Japanese details', () => {
  const room = FACILITY_ROOMS[0];
  const ics = buildBookingReminderIcs(
    room,
    '2027-07-18',
    '2027-04-01',
    'https://example.local/#/rooms/geijutsusozokan-engeki-dai'
  );
  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270401/);
  assert.match(ics, /DTEND;VALUE=DATE:20270402/);
  assert.match(ics, /大阪市立芸術創造館/);
  assert.match(ics, /END:VCALENDAR$/);
});
