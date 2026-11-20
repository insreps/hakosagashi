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

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'area_desc'
  | 'capacity_desc';

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
  areaSqm: number;
  capacity: number;
  flooring: string;
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
  registrationRule: string;
  reservationRule: string;
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
  maxBudget: number | null;
  minCapacity: number | null;
  minAreaSqm: number | null;
  outsideWardOnly: boolean;
  individualOnly: boolean;
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

export const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  facilityCategory: 'all',
  purposes: [],
  equipment: [],
  maxBudget: null,
  minCapacity: null,
  minAreaSqm: null,
  outsideWardOnly: false,
  individualOnly: false,
  sort: 'recommended',
};
