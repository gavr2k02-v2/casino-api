import { User } from './User';

export type UpdateUser = { oldPassword?: string } & Pick<User, 'avatar' | 'password' | 'name'>;
