import { IHttpRequest } from './IHttpRequest';

export interface IHttpContext {
  req?: IHttpRequest;
  res?: Record<string, any>;
}
