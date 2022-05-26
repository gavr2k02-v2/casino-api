import { inject, singleton } from 'tsyringe';
import { SpinPayload } from '../../common/types/slot/SpinPayload';
import { UtyaSlotGameTypes } from '../common/enums/SlotGameTypes';
import { UtyaSlotGameResponse } from '../common/types/UtyaSlotGameResponse';
import { SlotDITokens } from '../common/types/SlotDITokens';
import { ISlotStorage } from './ISlotStorage';
import { CasinoAmountServiceDIToken } from '../../common/services/types';
import { ICasinoAmountService } from '../../common/services/ICasinoAmountService';
import { queuePayAnalytics } from '../../common/queues';
import { v4 as uuidv4 } from 'uuid';
import { SpinAnalyticsPayload } from '../../common/queues/types';
import { GameId } from '../../common/types/games/enums/GameID';

const GAME_ID = GameId.UTYA_SLOT;

@singleton()
export class UtyaSlotUseCase {
  constructor(
    @inject(SlotDITokens.SLOT_STORAGE) private _storage: ISlotStorage,
    @inject(CasinoAmountServiceDIToken) private _amountService: ICasinoAmountService,
  ) {}

  public async spin(userId: string, payload: SpinPayload): Promise<UtyaSlotGameResponse> {
    const balance = await this._storage.getBalance(userId);
    if (!balance || payload.bet > balance) {
      throw new Error('Bet is over');
    }

    const amount = await this._amountService.getAmount(GAME_ID);

    const type = this.getWinOrLose(payload.bet, amount);
    const win = this.getWinAmount(payload.bet, type);
    const updatedBalance = balance + win;

    const spinAnalyticsPayload: SpinAnalyticsPayload = {
      id: uuidv4(),
      userId,
      action: GAME_ID,
      amount: win,
      time: new Date(),
      ip: '',
    };

    await Promise.all([
      this._amountService.updateAmount(GAME_ID, amount + -win),
      this._storage.updateBalance(userId, updatedBalance),
      queuePayAnalytics.sendToQueue(JSON.stringify(spinAnalyticsPayload)),
    ]);
    return { type, balance: updatedBalance, win };
  }

  private getWinAmount(bet: number, type: UtyaSlotGameTypes) {
    const amounts = {
      [UtyaSlotGameTypes.WIN]: bet,
      [UtyaSlotGameTypes.DRAW]: 0,
      [UtyaSlotGameTypes.LOSE]: -bet,
    };

    return amounts[type];
  }
  private getWinOrLose(bet: number, amount?: number) {
    if (amount < bet) {
      return UtyaSlotGameTypes.LOSE;
    }

    return this.getRandWinOrLose();
  }

  private getRandWinOrLose() {
    const num = Math.floor(Math.random() * 100);

    if (num < 45) {
      return UtyaSlotGameTypes.DRAW;
    }

    return num < 65 ? UtyaSlotGameTypes.WIN : UtyaSlotGameTypes.LOSE;
  }
}
