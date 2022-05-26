import { inject, singleton } from 'tsyringe';
import { SlotGameTypes } from '../common/enums/SlotGameTypes';
import { SlotResponse } from '../common/types/SlotResponse';
import { SpinPayload } from '../../common/types/slot/SpinPayload';
import { SlotDITokens } from '../common/types/SlotDITokens';
import { WinTypeData } from '../common/types/WinTypeData';
import { ISlotStorage } from './ISlotStorage';
import { CasinoAmountServiceDIToken } from '../../common/services/types';
import { ICasinoAmountService } from '../../common/services/ICasinoAmountService';
import { queuePayAnalytics } from '../../common/queues';
import { GameId } from '../../common/types/games/enums/GameID';
import { SpinAnalyticsPayload } from '../../common/queues/types';
import { v4 as uuidv4 } from 'uuid';

const GAME_ID = GameId.BIRD_SLOT;

@singleton()
export class SlotUseCase {
  private readonly _countSymbols = 4;
  private readonly _countLines = 3;
  private readonly _countTables = 5;

  constructor(
    @inject(SlotDITokens.SLOT_STORAGE) private _storage: ISlotStorage,
    @inject(CasinoAmountServiceDIToken) private _amountService: ICasinoAmountService,
  ) {}

  public async spin(userId: string, payload: SpinPayload): Promise<SlotResponse> {
    const balance = await this._storage.getBalance(userId);
    if (!balance || payload.bet > balance) {
      throw new Error('Bet is over');
    }

    const amount = await this._amountService.getAmount(GAME_ID);

    const type = this.getWinOrLose();
    const response = this.getSpinResponse(payload.bet, type, amount);
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

  private getSpinResponse(bet: number, type: SlotGameTypes, amount: number): Omit<SlotResponse, 'balance'> {
    const functions = {
      [SlotGameTypes.LOSE]: this.getLoseResult.bind(this),
      [SlotGameTypes.WIN]: this.getWinResult.bind(this),
      [SlotGameTypes.BIG_WIN]: this.getWinResult.bind(this),
    };

    const result = functions[type](bet, type);

    return this.validateResult(result, amount, bet);
  }

  private validateResult(
    result: Omit<SlotResponse, 'balance'>,
    amount: number,
    bet: number,
  ): Omit<SlotResponse, 'balance'> {
    return result.win > amount ? this.getLoseResult(bet) : result;
  }

  private getLoseResult(bet: number): Omit<SlotResponse, 'balance'> {
    const symbols = this.getSymbolsByGameType({ type: SlotGameTypes.LOSE });

    return {
      symbols,
      type: SlotGameTypes.LOSE,
      win: -bet,
      winSymbols: [],
    };
  }

  private getWinResult(bet: number, type: SlotGameTypes): Omit<SlotResponse, 'balance'> {
    const data = this.getWinTypeData(type);
    const symbols = this.getSymbolsByGameType(data);
    const win = this.getWinAmount(bet, data);

    return { symbols, type, win, winSymbols: this.getWinSymbols(symbols, data) };
  }

  private getWinSymbols(symbols: number[][], data: WinTypeData) {
    const winSymbols = [];

    for (let i = 0; i < data.count; i++) {
      winSymbols.push(symbols[i].map((item) => +(item === data.symbol)));
    }

    return winSymbols;
  }

  private getSymbolsByGameType(data: Partial<WinTypeData>): number[][] {
    const functions = {
      [SlotGameTypes.LOSE]: this.getLoseSymbols.bind(this),
      [SlotGameTypes.WIN]: this.getSymbolsByWinType.bind(this),
      [SlotGameTypes.BIG_WIN]: this.getSymbolsByBigWinType.bind(this),
    };

    const symbols: number[][] = [[], [], [], [], []];
    return functions[data.type](symbols, data.symbol, data.count, data.multi);
  }

  private getWinAmount(bet: number, data: WinTypeData): number {
    const win = Math.floor(this.getMultiplierByCount(data.count) * this.getMultiplierBySymbol(data.symbol) * bet);

    if (win === bet) {
      return 0;
    }

    return data.type === SlotGameTypes.BIG_WIN ? win + bet * (data.multi + 1) : win;
  }

  private getMultiplierBySymbol(symbol: number): number {
    const values = { 0: 1, 1: 3, 2: 5, 3: 7 };
    return values[symbol];
  }

  private getMultiplierByCount(count: number): number {
    const values = { 3: 1, 4: 3, 5: 5 };
    return values[count];
  }

  private getMultiplierByCountLines() {
    const num = Math.floor(Math.random() * 100);
    return num < 5 ? 2 : 1;
  }

  private getWinTypeData(type: SlotGameTypes): WinTypeData {
    const symbol = this.getSymbolByWinType(type);
    const count = this.getCountByWinType(type);
    const multi = this.getMultiplierByCountLines();
    return { type, symbol, count, multi };
  }

  private getWinOrLose() {
    const num = Math.floor(Math.random() * 100);

    if (num < 5) {
      return SlotGameTypes.BIG_WIN;
    }

    return num < 35 ? SlotGameTypes.WIN : SlotGameTypes.LOSE;
  }

  private getCountByWinType(type: SlotGameTypes): number {
    const num = Math.floor(Math.random() * 100);

    switch (true) {
      case num <= 80:
        return 3;
      case num <= 90:
        return 4;
      case num <= 100:
        return 5;
    }
  }

  private getSymbolByWinType(type: SlotGameTypes): number {
    const num = Math.floor(Math.random() * 100);

    switch (true) {
      case num <= 70:
        return 0;
      case num <= 80:
        return 1;
      case num <= 90:
        return 2;
      case num <= 100:
        return 3;
    }
  }

  private getSymbolsByBigWinType(symbols: number[][], symbol: number, count: number, multi: number) {
    return multi === 2
      ? this.getSymbolsByBigWinAllLines(symbols, symbol, count)
      : this.getSymbolsByBigWinTwoLines(symbols, symbol, count);
  }

  private getSymbolsByBigWinTwoLines(symbols: number[][], symbol: number, count: number) {
    const result = this.getSymbolsByWinType(symbols, symbol, count);
    const first = result[0].indexOf(symbol);

    return symbols[0][first] === symbols[1][first]
      ? this.setAdditionalWinLineHorizontal(symbols, symbol, count, first)
      : this.setAdditionalWinLineVertical(symbols, symbol, count, first);
  }

  private setAdditionalWinLineVertical(symbols: number[][], symbol: number, count: number, first: number) {
    for (let i = 0; i < count; i++) {
      const key = this.getKeyLineByIndex(2 - first, i);
      symbols[i][key] = symbol;
    }

    return symbols;
  }

  private setAdditionalWinLineHorizontal(symbols: number[][], symbol: number, count: number, first: number) {
    const key = this.getOtherKey([first], this._countLines);
    for (let i = 0; i < count; i++) {
      symbols[i][key] = symbol;
    }

    if (count !== 5 && symbols[count][key] === symbol) {
      symbols[count][key] = this.getOtherKey([symbol], this._countSymbols);
    }

    return symbols;
  }

  private getSymbolsByBigWinAllLines(symbols: number[][], symbol: number, count: number) {
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 3; k++) {
        symbols[i][k] = symbol;
      }
    }

    return this.getLoseSymbols(symbols, count);
  }

  private getSymbolsByWinType(symbols: number[][], symbol: number, count: number) {
    const firstIndex = Math.floor(Math.random() * 3);
    const inLine = firstIndex === 1 || !Math.round(Math.random());

    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 3; k++) {
        this.fillWinTable(symbols, i, k, symbol, firstIndex, inLine);
      }
    }

    return this.getLoseSymbols(symbols, count);
  }

  private fillWinTable(symbols: number[][], i: number, k: number, symbol: number, firstIndex: number, inLine: boolean) {
    return i === 0
      ? this.fillFirstWinColum(symbols, i, k, symbol, firstIndex)
      : this.fillSomeWinColum(symbols, i, k, symbol, firstIndex, inLine);
  }

  private fillFirstWinColum(symbols: number[][], i: number, k: number, symbol: number, firstIndex: number): void {
    symbols[i][k] = k === firstIndex ? symbol : this.getOtherKey([symbol], this._countSymbols);
    this.updateSymbolsInFirstColum(symbols, i, k, symbol, firstIndex);
  }

  private updateSymbolsInFirstColum(
    symbols: number[][],
    i: number,
    k: number,
    symbol: number,
    firstIndex: number,
  ): void {
    if (k === 2) {
      const [first, second, last] = symbols[i];

      if (first !== second && first !== last && second !== last) {
        const index = this.getOtherKey([firstIndex], this._countLines);
        symbols[i][index] = this.getOtherKey([symbols[i][index], symbols[i][firstIndex]], this._countSymbols);
      }
    }
  }

  private fillSomeWinColum(
    symbols: number[][],
    i: number,
    k: number,
    symbol: number,
    firstIndex: number,
    inLine: boolean,
  ): void {
    const next = inLine ? firstIndex : this.getKeyLineByIndex(firstIndex, i);

    if (k === 0 && k !== next) {
      const [first, second] = symbols[i - 1];
      symbols[i][k] = this.getOtherKey([first, second, symbol], this._countSymbols);
      return;
    }

    if (k === 1 && k !== next) {
      const [first, second, last] = symbols[i - 1];
      symbols[i][k] = this.getOtherKey([first, second, last, symbol], this._countSymbols);
      return;
    }

    if (k === 2 && k !== next) {
      const [, second, last] = symbols[i - 1];
      symbols[i][k] = this.getOtherKey([second, last, symbol], this._countSymbols);
      return;
    }

    symbols[i][k] = symbol;
  }

  private getLoseSymbols(symbols: number[][], count = 0): number[][] {
    for (let i = count; i < this._countTables; i++) {
      for (let k = 0; k < this._countLines; k++) {
        this.fillLoseTable(symbols, i, k);
      }
    }

    return symbols;
  }

  private fillLoseTable(symbols: number[][], i: number, k: number) {
    return i === 0 ? this.fillFirstLoseColum(symbols, i, k) : this.fillSomeLoseColum(symbols, i, k);
  }

  private fillFirstLoseColum(symbols: number[][], i: number, k: number): void {
    const symbol = Math.floor(Math.random() * this._countSymbols);
    symbols[i][k] = symbol;

    if (k === 2) {
      const [first, second, last] = symbols[i];
      if (first !== second && first !== last && second !== last) {
        const key = Math.floor(Math.random() * this._countSymbols - 1);
        const secondKey = this.getOtherKey([key], this._countLines);

        symbols[i][key] = symbols[i][secondKey];
      }
    }
  }

  private fillSomeLoseColum(symbols: number[][], i: number, k: number): void {
    if (k === 0) {
      const [first, second] = symbols[i - 1];
      const symbol = this.getOtherKey([first, second], this._countSymbols);
      symbols[i][k] = symbol;
      return;
    }

    if (k === 1) {
      const [first, second, last] = symbols[i - 1];
      const symbol = this.getOtherKey([first, second, last], this._countSymbols);
      symbols[i][k] = symbol;
      return;
    }

    if (k === 2) {
      const [, second, last] = symbols[i - 1];
      const symbol = this.getOtherKey([second, last], this._countSymbols);
      symbols[i][k] = symbol;
      return;
    }
  }

  private getKeyLineByIndex(first: number, index: number): number {
    switch (true) {
      case index === 1 || index === 3:
        return 1;
      case index === 2:
        return 2 - first;
      case index === 4 || index === 0:
        return first;
    }
  }

  private getOtherKey(keys: number[], keysCount: number): number {
    const allowKeys = Array.from(Array(keysCount).keys());
    const result = [];

    allowKeys.forEach((key) => !keys.includes(key) && result.push(key));
    return result[Math.floor(Math.random() * result.length)];
  }
}
