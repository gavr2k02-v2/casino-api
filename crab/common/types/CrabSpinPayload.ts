import { SpinPayload } from '../../../common/types/slot/SpinPayload';

export type CrabSpinPayload = {
  index: number;
  line: number;
} & SpinPayload;
