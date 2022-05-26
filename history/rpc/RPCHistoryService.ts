import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { HistoryPayload } from '../common/types/HistoryPayload';
import { HistoryResponse } from '../common/types/HistoryResponse';
import { SpinHistory } from '../common/types/SpinHistory';
import { HistoryUseCase } from '../usecase/HistoryUseCase';

export class RPCHistoryService {
  private readonly _useCase: HistoryUseCase = container.resolve(HistoryUseCase);

  public getHistory(context: IRPCContext, payload: HistoryPayload): Promise<HistoryResponse[]> {
    return this._useCase.getHistory(context.userId, payload);
  }

  public getCountPages(context: IRPCContext, limit: number): Promise<number> {
    return this._useCase.getCountPages(context.userId, limit);
  }

  public getLastSpines(context: IRPCContext, limit: number): Promise<SpinHistory[]> {
    return this._useCase.getLastSpines(limit);
  }
}
