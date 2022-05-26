import { Collection, Db, MongoClient } from 'mongodb';
import { env } from 'process';

const DB_NAME = 'casino';
class MongoDB {
  private _client: MongoClient;

  constructor() {
    if (!env.MONGODB_URL) {
      throw 'MONGODB_URL is not defined';
    }
  }

  public async getCollection<T>(name: string): Promise<Collection<T>> {
    const db = await this.getDB();
    return db.collection(name);
  }

  public async getDB(): Promise<Db> {
    const client = await this.getMongoClient();
    return client.db(DB_NAME);
  }

  private async getMongoClient(): Promise<MongoClient> {
    if (this._client) {
      return this._client;
    }

    await this.initDb();
    return this._client;
  }

  private async initDb(): Promise<void> {
    const client = new MongoClient(env.MONGODB_URL);
    this._client = await client.connect();
  }
}

export const mongoClient = new MongoDB();
