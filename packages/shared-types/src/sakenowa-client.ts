/**
 * CM-02 SakenowaClient インターフェース
 * Unit 1 ではインターフェース定義＋スタブ。Unit 3 で API 本実装に差し替え。
 * DynamoDB キャッシュ = SakenowaCache テーブル
 */

export interface SakenowaArea {
  id: number;
  name: string;
}

export interface SakenowaBrand {
  id: number;
  name: string;
  breweryId: number;
}

export interface SakenowaBrewery {
  id: number;
  name: string;
  areaId: number;
}

export interface SakenowaRanking {
  brandId: number;
  score: number;
  rank: number;
}

export interface SakenowaFlavorChart {
  brandId: number;
  f1: number; // 華やか
  f2: number; // 芳醇
  f3: number; // 重厚
  f4: number; // 穏やか
  f5: number; // ドライ
  f6: number; // 軽快
}

export interface SakenowaClient {
  getAreas(): Promise<SakenowaArea[]>;
  getBrands(): Promise<SakenowaBrand[]>;
  getBreweries(): Promise<SakenowaBrewery[]>;
  getRankings(): Promise<SakenowaRanking[]>;
  getFlavorCharts(): Promise<SakenowaFlavorChart[]>;
}

/**
 * SakenowaClient スタブ実装
 * Unit 1 ではキャッシュ済みサンプルデータを返却
 */
export class SakenowaClientStub implements SakenowaClient {
  async getAreas(): Promise<SakenowaArea[]> {
    return [
      { id: 1, name: '北海道' },
      { id: 13, name: '東京都' },
      { id: 15, name: '新潟県' },
    ];
  }

  async getBrands(): Promise<SakenowaBrand[]> {
    return [
      { id: 1, name: '獺祭', breweryId: 1 },
      { id: 2, name: '久保田', breweryId: 2 },
      { id: 3, name: '八海山', breweryId: 3 },
    ];
  }

  async getBreweries(): Promise<SakenowaBrewery[]> {
    return [
      { id: 1, name: '旭酒造', areaId: 35 },
      { id: 2, name: '朝日酒造', areaId: 15 },
      { id: 3, name: '八海醸造', areaId: 15 },
    ];
  }

  async getRankings(): Promise<SakenowaRanking[]> {
    return [
      { brandId: 1, score: 4.5, rank: 1 },
      { brandId: 2, score: 4.3, rank: 2 },
      { brandId: 3, score: 4.2, rank: 3 },
    ];
  }

  async getFlavorCharts(): Promise<SakenowaFlavorChart[]> {
    return [
      { brandId: 1, f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.4, f5: 0.5, f6: 0.7 },
      { brandId: 2, f1: 0.5, f2: 0.7, f3: 0.6, f4: 0.5, f5: 0.4, f6: 0.3 },
      { brandId: 3, f1: 0.4, f2: 0.5, f3: 0.5, f4: 0.6, f5: 0.6, f6: 0.5 },
    ];
  }
}
