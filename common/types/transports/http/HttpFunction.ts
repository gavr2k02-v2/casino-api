import { IHttpContext } from './IHttpContext';
import { IHttpRequest } from './IHttpRequest';

export type HttpFunction = (context: IHttpContext, req: IHttpRequest) => Promise<void>;
