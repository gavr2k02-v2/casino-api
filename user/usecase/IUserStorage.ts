import { User } from '../../common/types/user/User';

export interface IUserStorage {
  create(user: User): Promise<void>;
  getUser(payload: Partial<User>): Promise<User>;
  updateBalance(uid: string, amount: number): Promise<void>;
  updateUser(uid: string, user: Partial<Pick<User, 'avatar' | 'password' | 'name'>>): Promise<void>;
}
