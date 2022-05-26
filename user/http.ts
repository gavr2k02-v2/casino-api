import 'reflect-metadata';
import { wrapRPC } from '../common/transports/http/rpc-wrapper';
import { HttpFunction } from '../common/types/transports/http/HttpFunction';
import { RPCUserService } from './rpc/RPCUserService';
import { container } from 'tsyringe';
import { UserUseCase } from './usecase/UserUseCase';
import { UserDITokens } from './common/types/UserDITokens';
import { UserStorage } from './storage/UserStorage';
import { WalletDITokens } from './common/types/WalletDITokens';
import { WalletStorage } from './storage/WalletStorage';

container.register(UserDITokens.USER_USE_CASE, UserUseCase);
container.register(UserDITokens.USER_STORAGE, UserStorage);
container.register(WalletDITokens.WALLET_STORAGE, WalletStorage);

const rpc = new RPCUserService();
const handler: HttpFunction = wrapRPC(rpc);

export default handler;
