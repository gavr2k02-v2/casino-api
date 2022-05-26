import { HttpMethod } from './HttpMethod';

export interface IHttpRequest {
  method: HttpMethod | null;
  url: string;
  headers: {
    [key: string]: string;
  };
  query: {
    [key: string]: string;
  };
  body?: any;
  params?: Record<string, string>;
}
