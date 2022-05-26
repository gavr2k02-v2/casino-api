import { GameId } from '../common/types/games/enums/GameID';
import { redisPool } from '../common/util/redis';

export default async function () {
  const games = Object.values(GameId);
  console.log('Reset SCORES for Games', games);

  const client = redisPool.get();
  const pipeline = client.pipeline();

  for (const gameId of games) {
    pipeline.set(`${gameId}.amount`, '0');
  }

  await pipeline.exec();
}
