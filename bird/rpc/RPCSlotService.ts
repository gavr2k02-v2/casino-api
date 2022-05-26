import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { SlotResponse } from '../common/types/SlotResponse';
import { SpinPayload } from '../../common/types/slot/SpinPayload';
import { SlotUseCase } from '../usecase/SlotUseCase';

export class RPCSlotService {
  private readonly _useCase: SlotUseCase = container.resolve(SlotUseCase);

  public spin(context: IRPCContext, payload: SpinPayload): Promise<SlotResponse> {
    return this._useCase.spin(context.userId, payload);
  }
}
