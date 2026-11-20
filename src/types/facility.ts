export type FacilityCategory = 'public' | 'private';

export type PurposeType =
  | 'ダンス'
  | 'バンド'
  | '吹奏楽・管弦楽'
  | 'ピアノ・声楽'
  | '演劇'
  | 'ヨガ';

export type EquipmentKey =
  | 'wall_mirror'
  | 'barre'
  | 'piano'
  | 'amp'
  | 'drums';

export type FloorCategory =
  | 'linoleum'
  | 'hardwood'
  | 'soundproof_floor';

export type SoundproofTier =
  | 'pro_band'
  | 'brass_vocal'
  | 'dance_moderate';

export type RegistrationBarrier =
  | 'none'
  | 'web_only'
  | 'counter_required';

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'area_desc'
  | 'capacity_desc';

export interface PricingOption {
  id: string;
  label: string;
  price: number;
  unit: 'per_hour' | 'per_slot';
}

export interface PricingModel {
  unit: 'hourly' | 'slot';
  weekdayDayRate: number;
  weekdayNightRate: number;
  weekendDayRate: number;
  weekendNightRate: number;
  slotHours?: number;
  commercialMultiplier?: number;
  paidOptions?: PricingOption[];
}

export interface ReservationLeadMeta {
  releaseType: 'first_of_month' | 'rolling_months' | 'rolling_days' | 'instant';
  monthsAhead?: number;
  daysBefore?: number;
  releaseDayNote: string;
}

export interface RoomRecord {
  id: string;
  isSampleData: boolean;
  facilityName: string;
  roomName: string;
  facilityCategory: FacilityCategory;
  ward: string;
  address: string;
  nearestStation: string;
  stationKeywords: string[];
  hourlyRateMin: number;
  hourlyRateMax?: number;
  pricingNote: string;
  pricingModel: PricingModel;
  areaSqm: number;
  capacity: number;
  flooring: string;
  floorCategory: FloorCategory;
  mirror: {
    available: boolean;
    description: string;
  };
  barre: {
    available: boolean;
    description: string;
  };
  soundproofing: {
    level: string;
    description: string;
  };
  soundproofTier: SoundproofTier;
  drumsAllowed: boolean;
  drumsNote: string;
  piano: {
    available: boolean;
    type: string;
  };
  ampsAvailable: boolean;
  audioEquipment: string;
  equipmentFlags: EquipmentKey[];
  purposes: PurposeType[];
  outsideWardAllowed: boolean;
  individualAllowed: boolean;
  groupRegistrationRequired: boolean;
  registrationBarrier: RegistrationBarrier;
  registrationRule: string;
  reservationRule: string;
  reservationLeadMeta: ReservationLeadMeta;
  cautionsSummary: string;
  cautions: string[];
  officialSiteUrl: string;
  officialBookingUrl: string;
  lastVerifiedAt: string;
  sourceInfo: string;
  imageUrl: string;
  recommended: boolean;
  recommendedOrder: number;
}

export interface SearchFilters {
  keyword: string;
  facilityCategory: FacilityCategory | 'all';
  purposes: PurposeType[];
  equipment: EquipmentKey[];
  floorCategories: FloorCategory[];
  soundproofTiers: SoundproofTier[];
  maxBudget: number | null;
  minCapacity: number | null;
  minAreaSqm: number | null;
  outsideWardOnly: boolean;
  individualOnly: boolean;
  noGroupRegOnly: boolean;
  favoritesOnly: boolean;
  sort: SortOption;
}

export const ALL_PURPOSES: PurposeType[] = [
  'ダンス',
  'バンド',
  '吹奏楽・管弦楽',
  'ピアノ・声楽',
  '演劇',
  'ヨガ',
];

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  wall_mirror: '壁面鏡あり',
  barre: 'レッスンバーあり',
  piano: 'ピアノあり',
  amp: 'アンプあり',
  drums: 'ドラム使用可能',
};

export const ALL_EQUIPMENT_KEYS: EquipmentKey[] = [
  'wall_mirror',
  'barre',
  'piano',
  'amp',
  'drums',
];

export const ALL_FLOOR_CATEGORIES: FloorCategory[] = [
  'linoleum',
  'hardwood',
  'soundproof_floor',
];

export const FLOOR_CATEGORY_LABELS: Record<FloorCategory, string> = {
  linoleum: 'リノリウム',
  hardwood: 'フローリング・板張り',
  soundproof_floor: '防音スタジオ床・ホール',
};

export const ALL_SOUNDPROOF_TIERS: SoundproofTier[] = [
  'pro_band',
  'brass_vocal',
  'dance_moderate',
];

export const SOUNDPROOF_TIER_LABELS: Record<SoundproofTier, string> = {
  pro_band: 'バンド・ドラム可（高遮音）',
  brass_vocal: '楽器・声楽対応（防音）',
  dance_moderate: 'ダンス・演劇向け（一般遮音）',
};

export const REGISTRATION_BARRIER_LABELS: Record<RegistrationBarrier, string> = {
  none: '登録不要・WEB即時',
  web_only: 'WEB会員登録が必要',
  counter_required: '事前の窓口・書面手続きが必要',
};

export const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  facilityCategory: 'all',
  purposes: [],
  equipment: [],
  floorCategories: [],
  soundproofTiers: [],
  maxBudget: null,
  minCapacity: null,
  minAreaSqm: null,
  outsideWardOnly: false,
  individualOnly: false,
  noGroupRegOnly: false,
  favoritesOnly: false,
  sort: 'recommended',
};
