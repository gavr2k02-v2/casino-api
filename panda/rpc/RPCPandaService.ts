import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { CrabSpinPayload } from '../common/types/CrabSpinPayload';
import { CrabSlotUseCase } from '../usecase/CrabSlotUseCase';
import { CrabSlotResponse } from '../common/types/CrabSlotResponse';

export class RPCPandaService {
  public spin(context: IRPCContext, payload: CrabSpinPayload): Promise<CrabSlotResponse> {}
}
