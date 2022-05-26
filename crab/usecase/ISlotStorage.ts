export interface ISlotStorage {
  updateBalance(uid: string, balance: number): Promise<void>;
  getBalance(uid: string): Promise<number>;
}
