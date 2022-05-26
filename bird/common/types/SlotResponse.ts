import { SlotGameTypes } from '../enums/SlotGameTypes';

export type SlotResponse = {
  type: SlotGameTypes;
  balance: number;
  win: number;
  symbols: number[][];
  winSymbols: number[][];
};
