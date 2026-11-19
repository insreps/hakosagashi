import { FacilityCategory, RoomRecord } from '../types/facility';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface FacilityLocationGroup {
  facilityKey: string;
  facilityName: string;
  facilityCategory: FacilityCategory;
  ward: string;
  address: string;
  nearestStation: string;
  rooms: RoomRecord[];
  minHourlyRate: number;
  maxAreaSqm: number;
  maxCapacity: number;
}

export interface ResolvedFacilityPlace {
  facilityKey: string;
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: LatLngLiteral;
  googleMapsURI?: string;
}

export interface NearbyTransitStation {
  id: string;
  displayName: string;
  location: LatLngLiteral;
  distanceMeters: number;
  walkingMinutes: number;
  primaryType?: string;
  googleMapsURI?: string;
}

export function getFacilityKey(facilityName: string, address: string): string {
  return `${facilityName.trim()}__${address.trim()}`;
}

/**
 * 部屋配列を同一施設（建物・住所）ごとにグルーピングする純粋関数
 * 同一施設内に複数室（例: 芸術創造館 演劇練習室大 / 音楽練習室大）がある場合に1ピンへ集約する
 */
export function groupRoomsByFacility(
  rooms: RoomRecord[]
): FacilityLocationGroup[] {
  const indexByKey: Record<string, number> = {};
  const groups: FacilityLocationGroup[] = [];

  for (const room of rooms) {
    const key = getFacilityKey(room.facilityName, room.address);
    const existingIndex = indexByKey[key];
    if (existingIndex === undefined) {
      indexByKey[key] = groups.length;
      groups.push({
        facilityKey: key,
        facilityName: room.facilityName,
        facilityCategory: room.facilityCategory,
        ward: room.ward,
        address: room.address,
        nearestStation: room.nearestStation,
        rooms: [room],
        minHourlyRate: room.hourlyRateMin,
        maxAreaSqm: room.areaSqm,
        maxCapacity: room.capacity,
      });
    } else {
      const target = groups[existingIndex];
      target.rooms.push(room);
      if (room.hourlyRateMin < target.minHourlyRate) {
        target.minHourlyRate = room.hourlyRateMin;
      }
      if (room.areaSqm > target.maxAreaSqm) {
        target.maxAreaSqm = room.areaSqm;
      }
      if (room.capacity > target.maxCapacity) {
        target.maxCapacity = room.capacity;
      }
    }
  }

  return groups;
}

/**
 * 2点間の直線距離（メートル）をHaversine公式で算出する純粋関数
 */
export function calculateDistanceMeters(
  a: LatLngLiteral,
  b: LatLngLiteral
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      sinHalfLng *
      sinHalfLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

/**
 * 不動産表示基準（分速80m）で徒歩分数目安を算出
 */
export function estimateWalkingMinutes(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return 1;
  }
  return Math.max(1, Math.round(distanceMeters / 80));
}

/**
 * 距離の日本語表示フォーマット
 */
export function formatDistanceJapanese(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return '0m';
  }
  if (distanceMeters < 1000) {
    return `約${Math.round(distanceMeters)}m`;
  }
  return `約${(distanceMeters / 1000).toFixed(1)}km`;
}

/**
 * Tier 2 Google Maps Platform クォータ超過エラー判定
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;

  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (obj.status === 429 || obj.code === 429) return true;
    if (
      obj.status === 'RESOURCE_EXHAUSTED' ||
      obj.status === 'OVER_QUERY_LIMIT' ||
      obj.code === 'RESOURCE_EXHAUSTED' ||
      obj.code === 'OVER_QUERY_LIMIT'
    ) {
      return true;
    }
  }

  const message =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);

  return (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('OVER_QUERY_LIMIT') ||
    message.includes('OverQuotaMapError') ||
    message.includes('QuotaExceededError') ||
    message.includes('429')
  );
}
