export interface ICasinoAmountService {
  getAmount(gameId: string): Promise<number>;
  updateAmount(gameId: string, amount: number): Promise<void>;
}
