import { IHttpContext } from '../../common/types/transports/http/IHttpContext';
import { IHttpRequest } from '../../common/types/transports/http/IHttpRequest';

export interface IKoaContext {
  status?: number;
  body?: any;
  method?: string;
  url?: string;
  request?: IHttpRequest;
}

export enum FuncType {
  HTTP = 'httpTrigger',
  JOB = 'timerTrigger',
}

export type Handler = (context?: IHttpContext) => Promise<void>;

export type FuncData = { bindings: Record<string, string>[] };
