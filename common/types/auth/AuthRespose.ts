import { User } from '../user/User';

export type AuthRespose = {
  token: string;
  user: User;
};
