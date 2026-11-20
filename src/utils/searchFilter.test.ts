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

test('returns all 16 real Osaka rooms in recommended order when no filters are active', () => {
  const results = filterAndSortRooms(FACILITY_ROOMS, DEFAULT_FILTERS);
  assert.equal(results.length, 16);
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
  assert.equal(publicRooms.length, 10);
  assert.equal(privateRooms.length, 6);
  assert.ok(publicRooms.every((r) => r.facilityCategory === 'public'));
  assert.ok(privateRooms.every((r) => r.facilityCategory === 'private'));
});

test('filters by station or ward keyword accurately', () => {
  const umeda = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    keyword: '梅田',
  });
  assert.equal(umeda.length, 3);

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

test('filters by floorCategories, soundproofTiers, and noGroupRegOnly', () => {
  const linoleumNoReg = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    floorCategories: ['linoleum'],
    noGroupRegOnly: true,
  });
  assert.ok(linoleumNoReg.length >= 4);
  assert.ok(
    linoleumNoReg.every(
      (r) => r.floorCategory === 'linoleum' && !r.groupRegistrationRequired
    )
  );

  const proBand = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    soundproofTiers: ['pro_band'],
  });
  assert.equal(proBand.length, 5);
  assert.ok(proBand.every((r) => r.drumsAllowed));
});

test('filters by favoritesOnly when favoriteIds are supplied', () => {
  const favResults = filterAndSortRooms(
    FACILITY_ROOMS,
    { ...DEFAULT_FILTERS, favoritesOnly: true },
    ['buzz-shinsaibashi-a', 'geijutsusozokan-engeki-dai']
  );
  assert.equal(favResults.length, 2);
});

test('filters by capacity and minimum areaSqm', () => {
  const mediumLarge = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    minCapacity: 35,
    minAreaSqm: 70,
  });
  assert.equal(mediumLarge.length, 5);

  const extraLarge = filterAndSortRooms(FACILITY_ROOMS, {
    ...DEFAULT_FILTERS,
    minCapacity: 35,
    minAreaSqm: 100,
  });
  assert.equal(extraLarge.length, 4);
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
  assert.equal(largestFirst[0].id, 'higashinari-cc-small-hall');
  assert.ok(largestFirst[0].areaSqm >= largestFirst[1].areaSqm);
});

test('serializes and deserializes URL search params including extended filters', () => {
  const original = {
    ...DEFAULT_FILTERS,
    keyword: 'なんば',
    facilityCategory: 'private' as const,
    purposes: ['ダンス', '演劇'] as const,
    equipment: ['wall_mirror', 'piano'] as const,
    floorCategories: ['linoleum'] as const,
    soundproofTiers: ['pro_band'] as const,
    maxBudget: 2500,
    minCapacity: 15,
    minAreaSqm: 60,
    outsideWardOnly: true,
    individualOnly: false,
    noGroupRegOnly: true,
    favoritesOnly: true,
    sort: 'price_asc' as const,
  };
  const params = filtersToSearchParams({
    ...original,
    purposes: [...original.purposes],
    equipment: [...original.equipment],
    floorCategories: [...original.floorCategories],
    soundproofTiers: [...original.soundproofTiers],
  });
  const parsed = searchParamsToFilters(`?${params.toString()}`);

  assert.equal(parsed.keyword, 'なんば');
  assert.equal(parsed.facilityCategory, 'private');
  assert.deepEqual(parsed.purposes, ['ダンス', '演劇']);
  assert.deepEqual(parsed.equipment, ['wall_mirror', 'piano']);
  assert.deepEqual(parsed.floorCategories, ['linoleum']);
  assert.deepEqual(parsed.soundproofTiers, ['pro_band']);
  assert.equal(parsed.maxBudget, 2500);
  assert.equal(parsed.minCapacity, 15);
  assert.equal(parsed.minAreaSqm, 60);
  assert.equal(parsed.outsideWardOnly, true);
  assert.equal(parsed.individualOnly, false);
  assert.equal(parsed.noGroupRegOnly, true);
  assert.equal(parsed.favoritesOnly, true);
  assert.equal(parsed.sort, 'price_asc');
  assert.equal(countActiveFilters(parsed), 14);
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
