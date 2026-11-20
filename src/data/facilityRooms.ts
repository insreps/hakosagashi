import rawFacilityRooms from './facilityRooms.json';
import { RoomRecord } from '../types/facility';

/**
 * 大阪市内の実在公共施設・民間レンタルスペースデータ
 * 実データは同ディレクトリの facilityRooms.json で管理しています。
 * ※ 空き状況・料金改定・詳細規約は必ず各施設の公式サイトをご確認ください。
 */
export const FACILITY_ROOMS: RoomRecord[] = rawFacilityRooms as RoomRecord[];
