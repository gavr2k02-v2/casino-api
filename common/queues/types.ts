import { GameId } from '../types/games/enums/GameID';

export type SpinAnalyticsPayload = {
  id: string;
  action: GameId | string;
  userId: string;
  amount: number;
  time: Date;
  ip: string;
};
