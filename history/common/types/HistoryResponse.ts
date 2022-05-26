import { GameId } from '../../../common/types/games/enums/GameID';

export type HistoryResponse = {
  page: number;
  action: GameId;
  amount: number;
  time: Date;
};
