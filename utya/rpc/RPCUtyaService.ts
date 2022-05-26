import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { SpinPayload } from '../../common/types/slot/SpinPayload';
import { UtyaSlotGameResponse } from '../common/types/UtyaSlotGameResponse';
import { UtyaSlotUseCase } from '../usecase/UtyaSlotUseCase';

export class RPCUtyaService {
  private readonly _useCase: UtyaSlotUseCase = container.resolve(UtyaSlotUseCase);

  public spin(context: IRPCContext, payload: SpinPayload): Promise<UtyaSlotGameResponse> {
    return this._useCase.spin(context.userId, payload);
  }
}
