import { inject, singleton } from 'tsyringe';
import { AuthRespose } from '../../common/types/auth/AuthRespose';
import { SignUpPayload } from '../../common/types/auth/SignUpPayload';
import { User } from '../../common/types/user/User';
import { createToken } from '../../common/util/token';
import { UserDITokens } from '../common/types/UserDITokens';
import { IUserStorage } from './IUserStorage';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PubnubNotification } from '../../common/util/notification/PubnubNotification';
import { UpdateUser } from '../../common/types/user/UpdateUser';
import { PayInfo } from '../common/types/PayInfo';
import { WalletDITokens } from '../common/types/WalletDITokens';
import { IWalletStorage } from './IWalletStorage';
import { SpinAnalyticsPayload } from '../../common/queues/types';
import { queuePayAnalytics } from '../../common/queues';

@singleton()
export class UserUseCase {
  private _notifcation: PubnubNotification<User>;

  constructor(
    @inject(UserDITokens.USER_STORAGE) private _storage: IUserStorage,
    @inject(WalletDITokens.WALLET_STORAGE) private _walletStorage: IWalletStorage,
  ) {
    this._notifcation = new PubnubNotification();
  }

  public async withdraw(uid: string, amount: number, wallet: string): Promise<void> {
    const { balance } = await this._storage.getUser({ uid });

    if (balance < amount) {
      throw new Error('Not enough money');
    }

    await this.validateWallet(uid, wallet);

    const spinAnalyticsPayload: SpinAnalyticsPayload = {
      id: uuidv4(),
      userId: uid,
      action: 'withdraw',
      amount: -amount,
      time: new Date(),
      ip: '',
    };

    await Promise.all([
      this._storage.updateBalance(uid, -amount),
      this.updatePayInfoStorage(uid, { coins: -amount, time: Date.now(), wallet }),
      queuePayAnalytics.sendToQueue(JSON.stringify(spinAnalyticsPayload)),
    ]);

    const user = await this._storage.getUser({ uid });
    return this._notifcation.notify(user, `user-${uid}`);
  }

  public getPayInfo(uid: string): Promise<PayInfo[]> {
    return this._walletStorage.getPayInfosByUid(uid);
  }

  private async validateWallet(uid: string, wallet: string): Promise<void> {
    return this._walletStorage.validateWallet(uid, wallet);
  }

  private updatePayInfoStorage(uid: string, data: PayInfo) {
    return this._walletStorage.add(uid, data);
  }

  public async syncPayInfo(uid: string, payload: string): Promise<void> {
    const records = this.decryptionPayPayload(payload);
    await this.validateRecords(uid, records);

    const amount = +records[records.length - 1].coins;
    const spinAnalyticsPayload: SpinAnalyticsPayload = {
      id: uuidv4(),
      userId: uid,
      action: 'pay',
      amount: amount,
      time: new Date(),
      ip: '',
    };

    await Promise.all([
      this._storage.updateBalance(uid, amount),
      queuePayAnalytics.sendToQueue(JSON.stringify(spinAnalyticsPayload)),
      this._walletStorage.add(uid, records[records.length - 1]),
    ]);

    const user = await this._storage.getUser({ uid });
    return this._notifcation.notify(user, `user-${uid}`);
  }

  private decryptionPayPayload(payload: any): PayInfo[] {
    return payload?.map((items) => ({ wallet: items[0], time: items[1], coins: items[2] }));
  }

  private async validateRecords(uid: string, records: PayInfo[]): Promise<void> {
    const exists = await this._walletStorage.getRecordByParams(uid, records[records.length - 1]);

    if (exists) {
      throw new Error('Records synced');
    }

    for (let i = 0; i < records.length - 1; i++) {
      const exists = await this._walletStorage.getRecordByParams(uid, records[i]);
      if (!exists) {
        throw new Error('Records are not equal');
      }
    }
  }

  public async updateUser(uid: string, payload: UpdateUser) {
    await this.validateUpdateData(uid, payload);
    const data: Partial<Pick<User, 'avatar' | 'password' | 'name'>> = this.getUpdateData(payload);

    await this._storage.updateUser(uid, data);

    const user = await this._storage.getUser({ uid });
    return this._notifcation.notify(user, `user-${uid}`);
  }

  private getUpdateData(payload: UpdateUser): Partial<Pick<User, 'avatar' | 'password' | 'name'>> {
    const data: Partial<Pick<User, 'avatar' | 'password' | 'name'>> = {};

    payload.name && (data.name = payload.name);
    payload.avatar !== undefined && (data.avatar = payload.avatar);
    payload.password && (data.password = this.getHash(payload.password));

    return data;
  }

  private async validateUpdateData(uid: string, payload: UpdateUser): Promise<void> {
    if (!payload.oldPassword && !payload.name) {
      return;
    }

    if (payload.oldPassword) {
      const user = await this._storage.getUser({ uid });
      await this.validatePassword(user.password, payload.password);
    }

    await this.validateName(payload.name);
  }

  private async validateName(name: string): Promise<void> {
    if (name) {
      const user = await this._storage.getUser({ name });
      if (user) {
        throw new Error('Name exists');
      }
    }
  }

  public async loginByToken(uid: string): Promise<AuthRespose> {
    const user = await this._storage.getUser({ uid });
    if (!user) {
      throw new Error('Token is undefiend');
    }

    this.prepareUser(user);
    return { user, token: createToken(user.uid) };
  }

  public async signup(payload: SignUpPayload): Promise<AuthRespose> {
    const exists = await this._storage.getUser(payload as User);
    if (exists) {
      throw new Error('Name exists');
    }

    const user = await this.getDefaultUser(payload);
    await this._storage.create(user);
    this.prepareUser(user);
    return { user, token: createToken(user.uid) };
  }

  private async getDefaultUser({ name, password }: SignUpPayload): Promise<User> {
    const uid = uuidv4();
    const avatar = Math.floor(Math.random() * 5);
    const hash = await this.getHash(password);

    const user: User = { uid, name, password: hash, avatar, balance: 0 };
    return user;
  }

  private getHash(password: string) {
    return bcrypt.hash(password, 10);
  }

  public async loginByPassword(payload: SignUpPayload): Promise<AuthRespose> {
    const user = await this._storage.getUser(payload as User);
    if (!user) {
      throw new Error('Data is wrong');
    }

    await this.validatePassword(user.password, payload.password);

    this.prepareUser(user);
    return { user, token: createToken(user.uid) };
  }

  private async validatePassword(current: string, expected: string) {
    const result = await bcrypt.compare(expected, current);
    if (!result) {
      throw new Error('Data is wrong');
    }
  }

  private prepareUser(user: User) {
    user?.password && delete user.password;
    user?.['_id'] && delete user['_id'];
  }
}
