import { inject, singleton } from 'tsyringe';
import { HistoryPayload } from '../common/types/HistoryPayload';
import { HistoryResponse } from '../common/types/HistoryResponse';
import { IHistoryStorage } from './IHistoryStorage';
import { HistoryDITokens } from '../common/types/HistoryDITokens';

@singleton()
export class HistoryUseCase {
  constructor(@inject(HistoryDITokens.HISTORY_STORAGE) private _storage: IHistoryStorage) {}

  public getLastSpines(limit: number) {
    return this._storage.getLastSpines(limit);
  }

  public getHistory(userId: string, payload: HistoryPayload): Promise<HistoryResponse[]> {
    return this._storage.getHistory(userId, payload);
  }

  public async getCountPages(userId: string, limit: number): Promise<number> {
    const count = await this._storage.getCountRecords(userId);
    return Math.ceil(count / limit);
  }
}
