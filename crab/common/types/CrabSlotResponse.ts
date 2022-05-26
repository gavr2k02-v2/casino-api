import { CrabSlotGameTypes } from '../enums/SlotGameTypes';

export type CrabSlotResponse = {
  balance: number;
  win: number;
  type: CrabSlotGameTypes;
  symbols: number[];
  index: number;
  line: number;
};
