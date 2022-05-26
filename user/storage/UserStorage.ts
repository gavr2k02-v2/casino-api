import { Collection } from 'mongodb';
import { User } from '../../common/types/user/User';
import { mongoClient } from '../../common/util/storages/mongo';
import { IUserStorage } from '../usecase/IUserStorage';

export class UserStorage implements IUserStorage {
  private _collection: Collection;

  public async updateUser(uid: string, data: Partial<Pick<User, 'avatar' | 'password' | 'name'>>): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne({ uid }, { $set: data });
  }

  public async updateBalance(uid: string, amount: number): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne({ uid }, { $inc: { balance: amount } });
  }

  public async create(user: User): Promise<void> {
    const collection = await this.getCollection();
    await collection.insertOne(user);
  }

  public async getUser(payload: Partial<User>): Promise<User> {
    const collection = await this.getCollection();
    const match = this.getMatch(payload);
    return collection.findOne<User>(match);
  }

  private getMatch(payload: Partial<User>): Partial<User> {
    const match: Partial<User> = {};

    if (payload.uid) {
      match.uid = payload.uid;
    }

    if (payload.name) {
      match.name = payload.name;
    }

    return match;
  }

  private async getCollection() {
    if (this._collection) {
      return this._collection;
    }

    this._collection = await mongoClient.getCollection('users');
    return this._collection;
  }
}
