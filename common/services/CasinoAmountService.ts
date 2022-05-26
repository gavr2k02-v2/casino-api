import { redisPool } from '../util/redis';
import { ICasinoAmountService } from './ICasinoAmountService';

export class CasinoAmountService implements ICasinoAmountService {
  public async getAmount(gameId: string): Promise<number> {
    const client = redisPool.get();
    const result = await client.get(`${gameId}.amount`);
    return parseInt(result) || 0;
  }

  public async updateAmount(gameId: string, amount: number): Promise<void> {
    const client = redisPool.get();
    await client.set(`${gameId}.amount`, amount.toString());
  }
}
