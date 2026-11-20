import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITY_ROOMS } from '../data/facilityRooms';
import { DEFAULT_FILTERS } from '../types/facility';
import {
  countActiveFilters,
  filterAndSortRooms,
  filtersToSearchParams,
  formatRoomShareText,
  getRelatedRooms,
  searchParamsToFilters,
} from './searchFilter';

test('returns all real Osaka rooms in recommended order when no filters are active', () => {
  const results = filterAndSortRooms(FACILITY_ROOMS, DEFAULT_FILTERS);
  assert.equal(results.length, 10);
  assert.equal(results[0].id, 'geijutsusozokan-engeki-dai');
  assert.ok(results.every((r) => r.isSampleData === false));
});

test('filters by facilityCategory (public vs private)', () => {
  const publicRooms = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    facilityCategory: 'public',
  });
  const privateRooms = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    facilityCategory: 'private',
  });
  assert.equal(publicRooms.length, 7);
  assert.equal(privateRooms.length, 3);
  assert.ok(publicRooms.every((r) => r.facilityCategory === 'public'));
  assert.ok(privateRooms.every((r) => r.facilityCategory === 'private'));
});

test('filters by station or ward keyword accurately', () => {
  const umeda = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    keyword: '梅田',
  });
  assert.equal(umeda.length, 1);
  assert.equal(umeda[0].id, 'bassontop-umeda-1st');

  const shinosaka = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    keyword: '新大阪',
  });
  assert.equal(shinosaka.length, 2);
});

test('filters by equipment AND condition (wall_mirror + barre + piano)', () => {
  const results = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    equipment: ['wall_mirror', 'barre', 'piano'],
  });
  assert.equal(results.length, 2);
  const ids = results.map((r) => r.id).sort();
  assert.deepEqual(ids, ['creo-osaka-chuo-music', 'geijutsusozokan-engeki-dai']);
});

test('filters by drums allowed + individual allowed + budget', () => {
  const results = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    equipment: ['drums'],
    individualOnly: true,
    maxBudget: 1000,
  });
  assert.equal(results.length, 3);
});

test('filters by capacity and minimum areaSqm', () => {
  const mediumLarge = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    minCapacity: 35,
    minAreaSqm: 70,
  });
  assert.equal(mediumLarge.length, 3);
  assert.deepEqual(
    mediumLarge.map((r) => r.id).sort(),
    [
      'creo-osaka-chuo-music',
      'creo-osaka-minami-multipurpose',
      'geijutsusozokan-engeki-dai',
    ]
  );

  const extraLarge = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    minCapacity: 35,
    minAreaSqm: 100,
  });
  assert.equal(extraLarge.length, 2);
  assert.deepEqual(
    extraLarge.map((r) => r.id).sort(),
    ['creo-osaka-minami-multipurpose', 'geijutsusozokan-engeki-dai']
  );
});

test('sorts by price_asc and area_desc properly', () => {
  const cheapestFirst = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    sort: 'price_asc',
  });
  assert.equal(cheapestFirst[0].id, 'studio246-namba-rehearsal');
  assert.ok(cheapestFirst[0].hourlyRateMin <= cheapestFirst[1].hourlyRateMin);

  const largestFirst = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    sort: 'area_desc',
  });
  assert.equal(largestFirst[0].id, 'geijutsusozokan-ongaku-dai');
  assert.ok(largestFirst[0].areaSqm >= largestFirst[1].areaSqm);
});

test('serializes and deserializes URL search params including facilityCategory', () => {
  const original = {
    ...DEFAULT_FILTERS,
    keyword: 'なんば',
    facilityCategory: 'private' as const,
    purposes: ['ダンス', '演劇'] as const,
    equipment: ['wall_mirror', 'piano'] as const,
    maxBudget: 2500,
    minCapacity: 15,
    minAreaSqm: 60,
    outsideWardOnly: true,
    individualOnly: false,
    sort: 'price_asc' as const,
  };
  const params = filtersToSearchParams({
    ...original,
    purposes: [...original.purposes],
    equipment: [...original.equipment],
  });
  const parsed = searchParamsToFilters(`?${params.toString()}`);

  assert.equal(parsed.keyword, 'なんば');
  assert.equal(parsed.facilityCategory, 'private');
  assert.deepEqual(parsed.purposes, ['ダンス', '演劇']);
  assert.deepEqual(parsed.equipment, ['wall_mirror', 'piano']);
  assert.equal(parsed.maxBudget, 2500);
  assert.equal(parsed.minCapacity, 15);
  assert.equal(parsed.minAreaSqm, 60);
  assert.equal(parsed.outsideWardOnly, true);
  assert.equal(parsed.individualOnly, false);
  assert.equal(parsed.sort, 'price_asc');
  assert.equal(countActiveFilters(parsed), 10);
});

test('formats room share text without sample tag for real facilities and excludes self in related rooms', () => {
  const room = FACILITY_ROOMS[0];
  const text = formatRoomShareText(room, 'https://example.local/rooms/geijutsusozokan-engeki-dai');
  assert.doesNotMatch(text, /サンプル情報/);
  assert.match(text, /大阪市立芸術創造館/);
  assert.match(text, /演劇練習室 大/);

  const related = getRelatedRooms(room, FACILITY_ROOMS, 3);
  assert.equal(related.length, 3);
  assert.ok(related.every((r) => r.id !== room.id));
});
