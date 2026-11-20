import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITY_ROOMS } from '../data/facilityRooms';
import { estimateRoomSessionCost } from './priceCalculator';

test('calculates slot-based public facility cost and commercial multiplier accurately', () => {
  const room = FACILITY_ROOMS.find((r) => r.id === 'geijutsusozokan-engeki-dai');
  assert.ok(room);

  // 3 hours fits in 1 slot (2,700 yen)
  const regular = estimateRoomSessionCost(room, {
    dayType: 'weekday_day',
    hours: 3,
    participants: 10,
    commercialEvent: false,
    selectedOptionIds: [],
  });
  assert.equal(regular.baseCostYen, 2700);
  assert.equal(regular.totalYen, 2700);
  assert.equal(regular.perPersonYen, 270);
  assert.equal(regular.capacityWarning, null);

  // 5 hours requires 2 slots (5,400 yen), commercial 1.5x -> 8,100 yen
  const commercial = estimateRoomSessionCost(room, {
    dayType: 'weekday_day',
    hours: 5,
    participants: 9,
    commercialEvent: true,
    selectedOptionIds: [],
  });
  assert.equal(commercial.totalYen, 8100);
  assert.equal(commercial.perPersonYen, 900);
});

test('calculates hourly private studio cost with options and warns above capacity', () => {
  const room = FACILITY_ROOMS.find((r) => r.id === 'geijutsusozokan-ongaku-dai');
  assert.ok(room);

  const pianoOption = room.pricingModel.paidOptions?.[0];
  assert.ok(pianoOption);

  const res = estimateRoomSessionCost(room, {
    dayType: 'weekend_day',
    hours: 3,
    participants: 40,
    commercialEvent: false,
    selectedOptionIds: [pianoOption.id],
  });

  assert.equal(res.baseCostYen, 3000);
  assert.equal(res.optionsCostYen, pianoOption.price);
  assert.equal(res.totalYen, 3000 + pianoOption.price);
  assert.ok(res.capacityWarning && res.capacityWarning.includes('定員'));
});
