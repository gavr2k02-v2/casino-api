import { Collection } from 'mongodb';
import { GameId } from '../../common/types/games/enums/GameID';
import { mongoClient } from '../../common/util/storages/mongo';
import { HistoryPayload } from '../common/types/HistoryPayload';
import { HistoryResponse } from '../common/types/HistoryResponse';
import { SpinHistory } from '../common/types/SpinHistory';
import { IHistoryStorage } from '../usecase/IHistoryStorage';

export class HistoryStorage implements IHistoryStorage {
  private _collection: Collection;

  public async getLastSpines(limit: number): Promise<SpinHistory[]> {
    const collection = await this.getCollection();
    return collection
      .aggregate([
        { $match: { action: { $in: Object.values(GameId) } } },
        { $sort: { time: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'uid',
            as: 'user',
          },
        },
        {
          $project: {
            _id: 0,
            action: 1,
            amount: 1,
            time: 1,
            username: { $arrayElemAt: ['$user.name', 0] },
          },
        },
      ])
      .toArray() as Promise<SpinHistory[]>;
  }

  public async getCountRecords(userId: string): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments({ userId });
  }

  public async getHistory(userId: string, payload: HistoryPayload): Promise<HistoryResponse[]> {
    const collection = await this.getCollection();

    return collection
      .aggregate([
        {
          $match: {
            userId,
          },
        },
        {
          $sort: {
            time: -1,
          },
        },
        { $skip: payload.page * payload.limit },
        { $limit: payload.limit },
      ])
      .toArray() as Promise<HistoryResponse[]>;
  }

  private async getCollection() {
    if (this._collection) {
      return this._collection;
    }

    this._collection = await mongoClient.getCollection('analytics');
    return this._collection;
  }
}
