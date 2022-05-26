import { Collection } from 'mongodb';
import { mongoClient } from '../../common/util/storages/mongo';
import { PayInfo } from '../common/types/PayInfo';
import { IWalletStorage } from '../usecase/IWalletStorage';

export class WalletStorage implements IWalletStorage {
  private _collection: Collection;

  public async add(uid: string, payload: PayInfo): Promise<void> {
    const collection = await this.getCollection();
    await collection.insertOne({ uid, ...payload });
  }

  public async getRecordByParams(uid: string, info: Partial<PayInfo>): Promise<PayInfo> {
    const collection = await this.getCollection();
    return collection.findOne({ uid, ...info }) as unknown as Promise<PayInfo>;
  }

  public async getPayInfosByUid(uid: string): Promise<PayInfo[]> {
    const collection = await this.getCollection();
    return collection
      .aggregate([{ $match: { uid } }, { $limit: 5 }, { $project: { _id: 0, coins: 1, time: 1 } }])
      .toArray() as Promise<PayInfo[]>;
  }

  public async validateWallet(uid: string, wallet: string): Promise<void> {
    const collection = await this.getCollection();
    const result = await collection.findOne({ uid, wallet });
    if (!result) {
      throw new Error('Wallet is not exist');
    }
  }

  private async getCollection() {
    if (this._collection) {
      return this._collection;
    }

    this._collection = await mongoClient.getCollection('user');
    return this._collection;
  }
}
