import { RoomRecord } from '../types/facility';

export type SessionDayType =
  | 'weekday_day'
  | 'weekday_night'
  | 'weekend_day'
  | 'weekend_night';

export const SESSION_DAY_TYPE_LABELS: Record<SessionDayType, string> = {
  weekday_day: '平日・昼',
  weekday_night: '平日・夜',
  weekend_day: '土日祝・昼',
  weekend_night: '土日祝・夜',
};

export interface SessionCostInput {
  dayType: SessionDayType;
  hours: number;
  participants: number;
  commercialEvent: boolean;
  selectedOptionIds: string[];
}

export interface SessionCostResult {
  baseCostYen: number;
  optionsCostYen: number;
  totalYen: number;
  perPersonYen: number;
  appliedUnitsLabel: string;
  capacityWarning: string | null;
}

export function estimateRoomSessionCost(
  room: RoomRecord,
  input: SessionCostInput
): SessionCostResult {
  const model = room.pricingModel;
  const safeHours = Math.max(1, Math.min(12, Math.round(input.hours * 2) / 2));
  const safeParticipants = Math.max(1, Math.floor(input.participants));

  let rate = model.weekdayDayRate;
  switch (input.dayType) {
    case 'weekday_night':
      rate = model.weekdayNightRate;
      break;
    case 'weekend_day':
      rate = model.weekendDayRate;
      break;
    case 'weekend_night':
      rate = model.weekendNightRate;
      break;
    case 'weekday_day':
    default:
      rate = model.weekdayDayRate;
      break;
  }

  let baseCostYen = 0;
  let appliedUnitsLabel = '';

  if (model.unit === 'slot') {
    const slotHours = model.slotHours && model.slotHours > 0 ? model.slotHours : 4;
    const slots = Math.max(1, Math.ceil(safeHours / slotHours));
    baseCostYen = rate * slots;
    appliedUnitsLabel = `${slots}区分（1区分約${slotHours}時間） × ¥${rate.toLocaleString()}`;
  } else {
    baseCostYen = Math.round(rate * safeHours);
    appliedUnitsLabel = `${safeHours}時間 × ¥${rate.toLocaleString()}/h`;
  }

  if (input.commercialEvent && model.commercialMultiplier && model.commercialMultiplier > 1) {
    baseCostYen = Math.round(baseCostYen * model.commercialMultiplier);
    appliedUnitsLabel += `（営利・入場料徴収 ×${model.commercialMultiplier}）`;
  }

  let optionsCostYen = 0;
  if (model.paidOptions && input.selectedOptionIds.length > 0) {
    for (const opt of model.paidOptions) {
      if (input.selectedOptionIds.includes(opt.id)) {
        optionsCostYen +=
          opt.unit === 'per_hour' ? Math.round(opt.price * safeHours) : opt.price;
      }
    }
  }

  const totalYen = baseCostYen + optionsCostYen;
  const perPersonYen = Math.ceil(totalYen / safeParticipants);
  const capacityWarning =
    safeParticipants > room.capacity
      ? `入力人数（${safeParticipants}名）が部屋の定員（${room.capacity}名）を超えています。`
      : null;

  return {
    baseCostYen,
    optionsCostYen,
    totalYen,
    perPersonYen,
    appliedUnitsLabel,
    capacityWarning,
  };
}
