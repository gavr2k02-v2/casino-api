import { inject, singleton } from 'tsyringe';
import { queuePayAnalytics } from '../../common/queues';
import { SpinAnalyticsPayload } from '../../common/queues/types';
import { ICasinoAmountService } from '../../common/services/ICasinoAmountService';
import { CasinoAmountServiceDIToken } from '../../common/services/types';
import { GameId } from '../../common/types/games/enums/GameID';
import { CrabSlotGameTypes } from '../common/enums/SlotGameTypes';
import { CrabSlotResponse } from '../common/types/CrabSlotResponse';
import { CrabSpinPayload } from '../common/types/CrabSpinPayload';
import { SlotDITokens } from '../common/types/SlotDITokens';
import { ISlotStorage } from './ISlotStorage';
import { v4 as uuidv4 } from 'uuid';

const GAME_ID = GameId.CRAB_SLOT;

@singleton()
export class CrabSlotUseCase {
  private readonly _countTables = 6;
  private readonly _countLines = 6;

  constructor(
    @inject(SlotDITokens.SLOT_STORAGE) private _storage: ISlotStorage,
    @inject(CasinoAmountServiceDIToken) private _amountService: ICasinoAmountService,
  ) {}

  public async spin(userId: string, payload: CrabSpinPayload): Promise<CrabSlotResponse> {
    const balance = await this._storage.getBalance(userId);
    if (!balance || payload.bet > balance || payload.bet < 10) {
      throw new Error('Bet is over');
    }

    const amount = await this._amountService.getAmount(GAME_ID);
    const type = this.getWinOrLose(payload, amount);
    const response = this.getSpinResponse(payload.bet, type, payload.index, payload.line);
    const updatedBalance = balance + response.win;

    const spinAnalyticsPayload: SpinAnalyticsPayload = {
      id: uuidv4(),
      userId,
      action: GAME_ID,
      amount: response.win,
      time: new Date(),
      ip: '',
    };

    await Promise.all([
      this._amountService.updateAmount(GAME_ID, amount + -response.win),
      this._storage.updateBalance(userId, updatedBalance),
      queuePayAnalytics.sendToQueue(JSON.stringify(spinAnalyticsPayload)),
    ]);
    return { ...response, balance: updatedBalance };
  }

  private getSpinResponse(
    bet: number,
    type: CrabSlotGameTypes,
    index: number,
    line: number,
  ): Omit<CrabSlotResponse, 'balance'> {
    const functions = {
      [CrabSlotGameTypes.LOSE]: this.getLoseResult.bind(this),
      [CrabSlotGameTypes.WIN]: this.getWinResult.bind(this),
    };

    return functions[type](type, bet, index, line);
  }

  private getLoseResult(
    type: CrabSlotGameTypes,
    bet: number,
    index: number,
    line: number,
  ): Omit<CrabSlotResponse, 'balance'> {
    const symbols = this.getSymbolsByLine(type, index, line);
    const win = -bet;

    return { symbols, type, win, index, line };
  }

  private getWinResult(
    type: CrabSlotGameTypes,
    bet: number,
    index: number,
    line: number,
  ): Omit<CrabSlotResponse, 'balance'> {
    const symbols = this.getSymbolsByLine(type, index, line);
    const win = this.getWinAmount(bet, line);

    return { symbols, type, win, index, line };
  }

  private getSymbolsByLine(type: CrabSlotGameTypes, index: number, line: number): number[] {
    const functions = {
      [CrabSlotGameTypes.LOSE]: this.getLoseSymbols.bind(this),
      [CrabSlotGameTypes.WIN]: this.getWinSymbols.bind(this),
    };

    return functions[type](index, line);
  }

  private getWinSymbols(index: number, line: number): number[] {
    const winSymbols: number[] = Array(this._countTables).fill(0);
    const count = this.getCountWinsByLine(line) - 1;

    winSymbols[index] = 1;

    for (let i = 0; i < count; i++) {
      const idx = this.getIndexSymbol(winSymbols, index);
      winSymbols[idx] = 1;
    }

    return winSymbols;
  }

  private getLoseSymbols(index: number, line: number): number[] {
    const loseSymbols: number[] = Array(this._countTables).fill(0);
    const count = this.getCountWinsByLine(line);

    for (let i = 0; i < count; i++) {
      const idx = this.getIndexSymbol(loseSymbols, index);
      loseSymbols[idx] = 1;
    }

    return loseSymbols;
  }

  private getIndexSymbol(symbols: number[], index: number): number {
    let idx = Math.floor(Math.random() * this._countTables);

    while (symbols[idx] === 1 || idx === index) {
      idx = idx < symbols.length - 1 ? idx + 1 : 0;
    }

    return idx;
  }

  private getCountWinsByLine(line: number): number {
    return this._countLines - line - 1 || 1;
  }

  private getWinAmount(bet: number, line: number): number {
    return Math.floor(bet + Math.pow(bet / 5, line + 1));
  }

  private getWinOrLose(payload: CrabSpinPayload, amount: number) {
    const winAmount = this.getWinAmount(payload.bet, payload.line);
    if (winAmount > amount) {
      return CrabSlotGameTypes.LOSE;
    }

    const chance = 100 / ((payload.line + 1) * 3);
    const num = Math.floor(Math.random() * 100);

    return num < chance ? CrabSlotGameTypes.WIN : CrabSlotGameTypes.LOSE;
  }
}
