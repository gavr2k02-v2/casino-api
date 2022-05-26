import { HistoryPayload } from '../common/types/HistoryPayload';
import { HistoryResponse } from '../common/types/HistoryResponse';
import { SpinHistory } from '../common/types/SpinHistory';

export interface IHistoryStorage {
  getCountRecords(userId: string): Promise<number>;
  getHistory(uid: string, payload: HistoryPayload): Promise<HistoryResponse[]>;
  getLastSpines(limit: number): Promise<SpinHistory[]>;
}
