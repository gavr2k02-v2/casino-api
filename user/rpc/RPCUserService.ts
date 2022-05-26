import { container } from 'tsyringe';
import { IRPCContext } from '../../common/types/rpc/IRPCContext';
import { UserUseCase } from '../usecase/UserUseCase';
import { SignUpPayload } from '../../common/types/auth/SignUpPayload';
import { UpdateUser } from '../../common/types/user/UpdateUser';

export class RPCUserService {
  private readonly _useCase: UserUseCase = container.resolve(UserUseCase);

  public signup(context: IRPCContext, payload: SignUpPayload) {
    return this._useCase.signup(payload);
  }

  public loginByPassword(context: IRPCContext, payload: SignUpPayload) {
    return this._useCase.loginByPassword(payload);
  }

  public loginByToken(context: IRPCContext) {
    return this._useCase.loginByToken(context.userId);
  }

  public updateUser(context: IRPCContext, payload: UpdateUser) {
    return this._useCase.updateUser(context.userId, payload);
  }

  public syncPayInfo(context: IRPCContext, payload: string) {
    return this._useCase.syncPayInfo(context.userId, payload);
  }

  public withdraw(context: IRPCContext, { amount, wallet }): Promise<void> {
    return this._useCase.withdraw(context.userId, amount, wallet);
  }
}
