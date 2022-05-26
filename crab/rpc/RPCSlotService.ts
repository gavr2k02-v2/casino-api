import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { CrabSpinPayload } from '../common/types/CrabSpinPayload';
import { CrabSlotUseCase } from '../usecase/CrabSlotUseCase';
import { CrabSlotResponse } from '../common/types/CrabSlotResponse';

export class RPCSlotService {
  private readonly _useCase: CrabSlotUseCase = container.resolve(CrabSlotUseCase);

  public spin(context: IRPCContext, payload: CrabSpinPayload): Promise<CrabSlotResponse> {
    return this._useCase.spin(context.userId, payload);
  }
}
