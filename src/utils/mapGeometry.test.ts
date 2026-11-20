import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITY_ROOMS } from '../data/facilityRooms';
import {
  calculateDistanceMeters,
  dedupeNearbyStations,
  estimateWalkingMinutes,
  formatDistanceJapanese,
  getFacilityKey,
  groupRoomsByFacility,
  isQuotaExceededError,
  normalizeStationName,
} from './mapGeometry';

test('groupRoomsByFacility consolidates multiple rooms in the same facility', () => {
  const groups = groupRoomsByFacility(FACILITY_ROOMS);
  // 16 rooms in FACILITY_ROOMS across 13 unique physical facilities
  assert.equal(FACILITY_ROOMS.length, 16);
  assert.equal(groups.length, 13);

  const geijutsu = groups.find((g) =>
    g.facilityName.includes('芸術創造館')
  );
  assert.ok(geijutsu);
  assert.equal(geijutsu.rooms.length, 2);
  assert.equal(geijutsu.minHourlyRate, 980);
  assert.equal(geijutsu.maxAreaSqm, 145);
  assert.equal(geijutsu.maxCapacity, 35);

  const koko = groups.find((g) => g.facilityName.includes('KOKO PLAZA'));
  assert.ok(koko);
  assert.equal(koko.rooms.length, 2);
  assert.equal(koko.minHourlyRate, 950);

  const higashinari = groups.find((g) => g.facilityName.includes('東成区民センター'));
  assert.ok(higashinari);
  assert.equal(higashinari.rooms.length, 2);
});

test('getFacilityKey trims whitespace consistently', () => {
  assert.equal(
    getFacilityKey(' スタジオ246 NAMBA ', ' 大阪市中央区難波2-3-7 '),
    'スタジオ246 NAMBA__大阪市中央区難波2-3-7'
  );
});

test('normalizeStationName strips legacy operator/line prefixes and dedupeNearbyStations keeps shortest match', () => {
  assert.equal(normalizeStationName('大阪市交通局谷町線関目高殿駅'), '関目高殿駅');
  assert.equal(normalizeStationName('Osaka Metro 御堂筋線 新大阪駅'), '新大阪駅');

  const deduped = dedupeNearbyStations([
    {
      id: 'st-1',
      displayName: '関目高殿駅',
      location: { lat: 34.72, lng: 135.54 },
      distanceMeters: 730,
      walkingMinutes: 9,
    },
    {
      id: 'st-2',
      displayName: '大阪市交通局谷町線関目高殿駅',
      location: { lat: 34.72, lng: 135.54 },
      distanceMeters: 678,
      walkingMinutes: 8,
    },
    {
      id: 'st-3',
      displayName: '森小路駅',
      location: { lat: 34.73, lng: 135.55 },
      distanceMeters: 780,
      walkingMinutes: 10,
    },
  ]);

  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].displayName, '関目高殿駅');
  assert.equal(deduped[0].distanceMeters, 678);
  assert.equal(deduped[1].displayName, '森小路駅');
});

test('calculateDistanceMeters computes accurate Osaka station-to-facility distance', () => {
  const a = { lat: 34.7335, lng: 135.5003 };
  const b = { lat: 34.7371, lng: 135.5003 };
  const meters = calculateDistanceMeters(a, b);
  assert.ok(meters >= 390 && meters <= 410, `Expected ~400m, got ${meters}`);
});

test('estimateWalkingMinutes uses 80m/min standard with 1 min minimum', () => {
  assert.equal(estimateWalkingMinutes(0), 1);
  assert.equal(estimateWalkingMinutes(40), 1);
  assert.equal(estimateWalkingMinutes(240), 3);
  assert.equal(estimateWalkingMinutes(800), 10);
});

test('formatDistanceJapanese formats meters and kilometers properly', () => {
  assert.equal(formatDistanceJapanese(450), '約450m');
  assert.equal(formatDistanceJapanese(999), '約999m');
  assert.equal(formatDistanceJapanese(1000), '約1.0km');
  assert.equal(formatDistanceJapanese(1460), '約1.5km');
});

test('isQuotaExceededError detects Tier 2 GMP quota errors without false positives', () => {
  assert.equal(isQuotaExceededError({ status: 429 }), true);
  assert.equal(isQuotaExceededError({ status: 'RESOURCE_EXHAUSTED' }), true);
  assert.equal(isQuotaExceededError(new Error('OVER_QUERY_LIMIT reached')), true);
  assert.equal(isQuotaExceededError('OverQuotaMapError'), true);
  assert.equal(isQuotaExceededError(new Error('ZERO_RESULTS')), false);
  assert.equal(isQuotaExceededError(null), false);
});
