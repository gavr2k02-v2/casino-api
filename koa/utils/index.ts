import { readFileSync } from 'fs';
import Router from 'koa-router';
import { schedule } from 'node-cron';
import { IHttpContext } from '../../common/types/transports/http/IHttpContext';
import { IHttpRequest } from '../../common/types/transports/http/IHttpRequest';
import { FuncData, FuncType, Handler, IKoaContext } from './types';

export function readSettings(path: string) {
  const file = JSON.parse(readFileSync(path, 'utf-8'));
  const config = file.Values || file;
  Object.keys(config).forEach((key) => (process.env[key] = process.env[key] || config[key]));
}

export function importFuncs(dirNames: string[], router: Router) {
  dirNames.forEach((item) => item?.length && importFunc(item, router));
}

function importFunc(dirName: string, router: Router) {
  console.log(`Building func for ${dirName}`);

  const data = require(`../../${dirName}/function.json`);
  const handler = getHandler(dirName);

  buildFunc(data, handler, router);
}

function getHandler(dirName: string) {
  return require(`../../${dirName}/http`).default;
}

function buildFunc(data: FuncData, handler: Handler, router: Router) {
  const fns = {
    [FuncType.JOB]: startJob,
    [FuncType.HTTP]: addRoute,
  };

  const binding = data.bindings[0];
  return fns[binding.type](handler, binding, router);
}

function startJob(handler: Handler, binding: Record<string, string>) {
  schedule(binding.schedule || '* * * * *', async () => await handler());
}

async function addRoute(handler: Handler, binding: Record<string, string>, router: Router) {
  router.all(`/api/${binding.route}`, getKoaHandler(handler));
}

function getKoaHandler(handler: Handler) {
  return async (ctx: IKoaContext) => {
    const context = updateContext(createContext(), updateRequest(ctx.request));
    await handler(context);
    contextToKoaContext(context, ctx);
  };
}

function createContext() {
  const context: IHttpContext = {};
  return context;
}

function updateContext(context: IHttpContext, req: IHttpRequest) {
  context.req = req;
  return context;
}

function updateRequest(request: IHttpRequest) {
  return {
    headers: request.headers,
    body: request.body,
    method: request.method,
    url: request.url,
    query: request.query,
  };
}

function contextToKoaContext(context: IHttpContext, koaContext: IKoaContext) {
  koaContext.status = context.res.status || 200;
  koaContext.body = context.res.body;
}
