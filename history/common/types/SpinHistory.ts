import { GameId } from '../../../common/types/games/enums/GameID';

export type SpinHistory = {
  action: GameId;
  amount: number;
  time: Date;
  username: string;
};
