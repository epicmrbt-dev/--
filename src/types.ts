/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  grade: number; // 学年 (1, 2, 3)
  role?: string; // 役職 (e.g., 部長, 副部長, 会計)
}

export type RecordStatus = 'excellent' | 'observing' | 'maintenance';

export interface RecordTableItem {
  id: string;
  areaName: string;         // 飼育・栽培エリア名 (例: 「熱帯魚水槽」)
  assignedMemberId: string; // 担当部員のID
  status: RecordStatus;     // 現在の状態
  lastChecked: string;      // 最終確認日
  latestNote: string;       // 最新の確認メモ
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface DiaryEntry {
  id: string;
  title: string;
  category: string;       // 対象・カテゴリ (例: 「メダカ」「カブトムシ」「アサガオ」)
  weather: WeatherType;   // 天気
  content: string;        // 観察内容
  imageUrl?: string;      // 観察画像 (Base64またはURL)
  date: string;           // 観察日
  authorId: string;       // 投稿した部員のID
  createdAt: string;      // 作成日時
}
