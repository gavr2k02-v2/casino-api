import { UtyaSlotGameTypes } from '../enums/SlotGameTypes';

export type UtyaSlotGameResponse = {
  balance: number;
  win: number;
  type: UtyaSlotGameTypes;
};
