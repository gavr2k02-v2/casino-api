import 'reflect-metadata';
import { wrapRPC } from '../common/transports/http/rpc-wrapper';
import { HttpFunction } from '../common/types/transports/http/HttpFunction';
import { RPCUtyaService } from './rpc/RPCUtyaService';
import { container } from 'tsyringe';
import { SlotDITokens } from './common/types/SlotDITokens';
import { SlotStorage } from './storage/SlotStorage';
import { UtyaSlotUseCase } from './usecase/UtyaSlotUseCase';
import { CasinoAmountService } from '../common/services/CasinoAmountService';
import { CasinoAmountServiceDIToken } from '../common/services/types';

container.register(SlotDITokens.SLOT_USE_CASE, UtyaSlotUseCase);
container.register(SlotDITokens.SLOT_STORAGE, SlotStorage);
container.register(CasinoAmountServiceDIToken, CasinoAmountService);

const rpc = new RPCUtyaService();
const handler: HttpFunction = wrapRPC(rpc);

export default handler;
