import { PayInfo } from '../common/types/PayInfo';

export interface IWalletStorage {
  add(uid: string, payload: PayInfo): Promise<void>;
  getPayInfosByUid(uid: string): Promise<PayInfo[]>;
  getRecordByParams(uid: string, info: Partial<PayInfo>): Promise<PayInfo>;
  validateWallet(uid: string, wallet: string): Promise<void>;
}
