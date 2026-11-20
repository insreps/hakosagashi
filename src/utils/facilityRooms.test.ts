import assert from 'node:assert/strict';
import test from 'node:test';
import rawJson from '../data/facilityRooms.json';
import { FACILITY_ROOMS } from '../data/facilityRooms';
import {
  ALL_EQUIPMENT_KEYS,
  ALL_FLOOR_CATEGORIES,
  ALL_PURPOSES,
  ALL_SOUNDPROOF_TIERS,
} from '../types/facility';

test('facilityRooms.json contains valid, unique room records matching RoomRecord schema', () => {
  assert.ok(Array.isArray(rawJson));
  assert.equal(FACILITY_ROOMS.length, rawJson.length);
  assert.equal(FACILITY_ROOMS.length, 16);

  const seenIds = new Set<string>();
  for (const room of FACILITY_ROOMS) {
    assert.ok(room.id && !seenIds.has(room.id), `Duplicate or empty id: ${room.id}`);
    seenIds.add(room.id);

    assert.ok(room.facilityName.length > 0);
    assert.ok(room.roomName.length > 0);
    assert.ok(room.facilityCategory === 'public' || room.facilityCategory === 'private');
    assert.ok(room.hourlyRateMin > 0);
    assert.ok(room.areaSqm > 0);
    assert.ok(room.capacity > 0);
    assert.ok(ALL_FLOOR_CATEGORIES.includes(room.floorCategory));
    assert.ok(ALL_SOUNDPROOF_TIERS.includes(room.soundproofTier));
    assert.ok(room.purposes.length > 0);
    for (const p of room.purposes) {
      assert.ok(ALL_PURPOSES.includes(p), `Unexpected purpose ${p} in ${room.id}`);
    }
    for (const eq of room.equipmentFlags) {
      assert.ok(ALL_EQUIPMENT_KEYS.includes(eq), `Unexpected equipment ${eq} in ${room.id}`);
    }
    assert.match(room.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(room.officialSiteUrl, /^https?:\/\//);
    assert.match(room.officialBookingUrl, /^https?:\/\//);
  }
});
