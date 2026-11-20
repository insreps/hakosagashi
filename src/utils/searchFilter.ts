import {
  ALL_EQUIPMENT_KEYS,
  ALL_PURPOSES,
  DEFAULT_FILTERS,
  EquipmentKey,
  FacilityCategory,
  PurposeType,
  RoomRecord,
  SearchFilters,
  SortOption,
} from '../types/facility';

/**
 * 部屋リストを指定された複数条件で絞り込み・並び替えする純粋関数
 */
export function filterAndSortRooms(
  rooms: RoomRecord[],
  filters: SearchFilters
): RoomRecord[] {
  const normalizedKeyword = filters.keyword.trim().toLowerCase();

  const filtered = rooms.filter((room) => {
    // 0. 施設種別（公共施設 / 民間レンタルスペース）
    if (
      filters.facilityCategory !== 'all' &&
      room.facilityCategory !== filters.facilityCategory
    ) {
      return false;
    }

    // 1. エリア・駅名・施設名キーワード（スペース区切りAND検索）
    if (normalizedKeyword.length > 0) {
      const tokens = normalizedKeyword.split(/[\s\u3000]+/).filter(Boolean);
      const searchableText = [
        room.facilityName,
        room.roomName,
        room.ward,
        room.address,
        room.nearestStation,
        ...room.stationKeywords,
      ]
        .join(' ')
        .toLowerCase();

      const allTokensMatch = tokens.every((token) =>
        searchableText.includes(token)
      );
      if (!allTokensMatch) return false;
    }

    // 2. 用途（選択された用途のいずれかに対応しているか／OR条件）
    if (filters.purposes.length > 0) {
      const hasMatchingPurpose = filters.purposes.some((purpose) =>
        room.purposes.includes(purpose)
      );
      if (!hasMatchingPurpose) return false;
    }

    // 3. 設備（指定された設備をすべて備えているか／AND条件）
    if (filters.equipment.length > 0) {
      const hasAllEquipment = filters.equipment.every((eq) =>
        room.equipmentFlags.includes(eq)
      );
      if (!hasAllEquipment) return false;
    }

    // 4. 予算（1時間あたりの目安料金下限が上限予算以下か）
    if (filters.maxBudget !== null && filters.maxBudget > 0) {
      if (room.hourlyRateMin > filters.maxBudget) return false;
    }

    // 5. 利用人数（定員が指定人数以上か）
    if (filters.minCapacity !== null && filters.minCapacity > 0) {
      if (room.capacity < filters.minCapacity) return false;
    }

    // 6. 広さ（㎡が指定以上か）
    if (filters.minAreaSqm !== null && filters.minAreaSqm > 0) {
      if (room.areaSqm < filters.minAreaSqm) return false;
    }

    // 7. 区外利用可能
    if (filters.outsideWardOnly && !room.outsideWardAllowed) {
      return false;
    }

    // 8. 個人利用可能
    if (filters.individualOnly && !room.individualAllowed) {
      return false;
    }

    return true;
  });

  // 並び替え
  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'price_asc':
        return a.hourlyRateMin - b.hourlyRateMin || a.recommendedOrder - b.recommendedOrder;
      case 'area_desc':
        return b.areaSqm - a.areaSqm || a.hourlyRateMin - b.hourlyRateMin;
      case 'capacity_desc':
        return b.capacity - a.capacity || a.hourlyRateMin - b.hourlyRateMin;
      case 'recommended':
      default:
        return a.recommendedOrder - b.recommendedOrder;
    }
  });
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.keyword.trim()) count += 1;
  if (filters.facilityCategory !== 'all') count += 1;
  count += filters.purposes.length;
  count += filters.equipment.length;
  if (filters.maxBudget !== null) count += 1;
  if (filters.minCapacity !== null) count += 1;
  if (filters.minAreaSqm !== null) count += 1;
  if (filters.outsideWardOnly) count += 1;
  if (filters.individualOnly) count += 1;
  return count;
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('q', filters.keyword.trim());
  if (filters.facilityCategory !== 'all') params.set('cat', filters.facilityCategory);
  if (filters.purposes.length > 0) params.set('purpose', filters.purposes.join(','));
  if (filters.equipment.length > 0) params.set('eq', filters.equipment.join(','));
  if (filters.maxBudget !== null) params.set('budget', String(filters.maxBudget));
  if (filters.minCapacity !== null) params.set('cap', String(filters.minCapacity));
  if (filters.minAreaSqm !== null) params.set('area', String(filters.minAreaSqm));
  if (filters.outsideWardOnly) params.set('outside', '1');
  if (filters.individualOnly) params.set('individual', '1');
  if (filters.sort !== 'recommended') params.set('sort', filters.sort);
  return params;
}

export function searchParamsToFilters(search: string): SearchFilters {
  const params = new URLSearchParams(search);
  const keyword = params.get('q') ?? '';
  const rawCat = params.get('cat');
  const facilityCategory: FacilityCategory | 'all' =
    rawCat === 'public' || rawCat === 'private' ? rawCat : 'all';

  const rawPurposes = (params.get('purpose') ?? '').split(',').filter(Boolean);
  const purposes = rawPurposes.filter((p): p is PurposeType =>
    ALL_PURPOSES.includes(p as PurposeType)
  );

  const rawEq = (params.get('eq') ?? '').split(',').filter(Boolean);
  const equipment = rawEq.filter((e): e is EquipmentKey =>
    ALL_EQUIPMENT_KEYS.includes(e as EquipmentKey)
  );

  const parsePositiveInt = (val: string | null): number | null => {
    if (!val) return null;
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  };

  const sortParam = params.get('sort') as SortOption | null;
  const validSorts: SortOption[] = [
    'recommended',
    'price_asc',
    'area_desc',
    'capacity_desc',
  ];
  const sort = sortParam && validSorts.includes(sortParam) ? sortParam : 'recommended';

  return {
    ...DEFAULT_FILTERS,
    keyword,
    facilityCategory,
    purposes,
    equipment,
    maxBudget: parsePositiveInt(params.get('budget')),
    minCapacity: parsePositiveInt(params.get('cap')),
    minAreaSqm: parsePositiveInt(params.get('area')),
    outsideWardOnly: params.get('outside') === '1',
    individualOnly: params.get('individual') === '1',
    sort,
  };
}

/**
 * サークルメンバーへの共有用テキストを生成する純粋関数
 */
export function formatRoomShareText(room: RoomRecord, pageUrl: string): string {
  const category =
    room.facilityCategory === 'public' ? '公共施設' : '民間レンタルスペース';
  const badge = room.isSampleData ? `${category}・サンプル情報` : category;
  const lines = [
    `【${badge}】${room.facilityName} / ${room.roomName}`,
    `・最寄り駅: ${room.nearestStation}`,
    `・料金目安: 1時間あたり ¥${room.hourlyRateMin.toLocaleString()}〜`,
    `・広さ / 定員: ${room.areaSqm}㎡ / ${room.capacity}名`,
    `・鏡 / ドラム: ${room.mirror.available ? '鏡あり' : '鏡なし'} / ${
      room.drumsAllowed ? 'ドラム・打楽器可' : 'ドラム不可'
    }`,
    `・利用区分: ${room.outsideWardAllowed ? '区外・市外利用可' : '市内・区内限定'} / ${
      room.individualAllowed ? '個人利用可' : '団体利用'
    }`,
    `・注意事項: ${room.cautionsSummary}`,
    `・詳細URL: ${pageUrl}`,
  ];
  return lines.join('\n');
}

/**
 * 詳細ページ下部に表示する関連部屋（同じ用途や近いエリア）を抽出する純粋関数
 */
export function getRelatedRooms(
  targetRoom: RoomRecord,
  allRooms: RoomRecord[],
  limit = 3
): RoomRecord[] {
  return allRooms
    .filter((r) => r.id !== targetRoom.id)
    .map((candidate) => {
      let score = 0;
      const sharedPurposes = candidate.purposes.filter((p) =>
        targetRoom.purposes.includes(p)
      ).length;
      score += sharedPurposes * 3;
      if (candidate.ward === targetRoom.ward) score += 2;
      if (candidate.facilityCategory !== targetRoom.facilityCategory) score += 1;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.candidate.hourlyRateMin - b.candidate.hourlyRateMin)
    .slice(0, limit)
    .map((item) => item.candidate);
}
