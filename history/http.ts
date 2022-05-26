import 'reflect-metadata';
import { wrapRPC } from '../common/transports/http/rpc-wrapper';
import { HttpFunction } from '../common/types/transports/http/HttpFunction';
import { RPCHistoryService } from './rpc/RPCHistoryService';
import { container } from 'tsyringe';
import { HistoryDITokens } from './common/types/HistoryDITokens';
import { HistoryStorage } from './storage/HistoryStorage';
import { HistoryUseCase } from './usecase/HistoryUseCase';

container.register(HistoryDITokens.HISTORY_USE_CASE, HistoryUseCase);
container.register(HistoryDITokens.HISTORY_STORAGE, HistoryStorage);

const rpc = new RPCHistoryService();
const handler: HttpFunction = wrapRPC(rpc);

export default handler;
