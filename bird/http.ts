import 'reflect-metadata';
import { wrapRPC } from '../common/transports/http/rpc-wrapper';
import { HttpFunction } from '../common/types/transports/http/HttpFunction';
import { RPCSlotService } from './rpc/RPCSlotService';
import { container } from 'tsyringe';
import { SlotUseCase } from './usecase/SlotUseCase';
import { SlotDITokens } from './common/types/SlotDITokens';
import { SlotStorage } from './storage/SlotStorage';
import { CasinoAmountServiceDIToken } from '../common/services/types';
import { CasinoAmountService } from '../common/services/CasinoAmountService';

container.register(SlotDITokens.SLOT_USE_CASE, SlotUseCase);
container.register(SlotDITokens.SLOT_STORAGE, SlotStorage);
container.register(CasinoAmountServiceDIToken, CasinoAmountService);

const rpc = new RPCSlotService();
const handler: HttpFunction = wrapRPC(rpc);

export default handler;
