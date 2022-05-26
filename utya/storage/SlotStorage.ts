import { Collection } from 'mongodb';
import { GameId } from '../../common/types/games/enums/GameID';
import { User } from '../../common/types/user/User';
import { mongoClient } from '../../common/util/storages/mongo';
import { ISlotStorage } from '../usecase/ISlotStorage';

const GAME_ID = GameId.UTYA_SLOT;

export class SlotStorage implements ISlotStorage {
  private _collection: Collection;

  public async getBalance(uid: string): Promise<number> {
    const collection = await this.getCollection();
    const user = await collection.findOne<User>({ uid });

    return user?.balance;
  }

  public async updateBalance(uid: string, balance: number): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne({ uid }, { $set: { balance } });
  }

  private async getCollection() {
    if (this._collection) {
      return this._collection;
    }

    this._collection = await mongoClient.getCollection('users');
    return this._collection;
  }
}
