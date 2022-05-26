import IORedis, { Redis } from 'ioredis';
import { env } from 'process';

export class RedisPool {
  private readonly _pool: Redis[] = [];
  private readonly _max: number = 10;
  private _index = 0;
  private _timers: Map<Redis, NodeJS.Timeout> = new Map();

  private createRedisClient(): Redis {
    return new IORedis(env.REDIS_URL, { enableAutoPipelining: true }) as Redis;
  }

  public get(): Redis {
    const result: Redis = this.getFromPool();

    this._index++;
    if (this._index === this._max) {
      this._index = 0;
    }

    this.startClearTimer(result);
    return result;
  }

  private getFromPool(): Redis {
    if (this._pool[this._index]) {
      return this._pool[this._index];
    }

    this._pool[this._index] = this.createRedisClient();
    return this._pool[this._index];
  }

  private startClearTimer(value: Redis) {
    clearTimeout(this._timers.get(value));
    this._timers.set(value, setTimeout(this.clearRedisClient.bind(this, value), 10 * 60000));
  }

  private clearRedisClient(value: Redis) {
    const index = this._pool.indexOf(value);
    this._pool.splice(index, 1);
    value.disconnect();

    if (this._index > index) {
      this._index = index;
    }
  }
}
