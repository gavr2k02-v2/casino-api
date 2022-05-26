import { verifyToken } from '../../util/token';
import { IRPCContext } from '../../types/rpc/IRPCContext';
import { IHttpContext } from '../../types/transports/http/IHttpContext';
import { NotAuthUserId } from '../../constants/NotAuthUserId';

export function wrapRPC<T>(rpc: T) {
  return async (context: IHttpContext) => {
    try {
      const token = context.req.headers.authorization;
      const info = token !== 'null' && token && verifyToken(token);

      const [methodName, ...params] = context.req.body;
      const rpcContext: IRPCContext = { userId: info?.userId || NotAuthUserId };

      console.log(`Method: "${methodName}", params: ${convertParamsToString(params)}`);
      const result = await rpc[methodName](rpcContext, ...params);
      context.res = {
        status: 200,
        body: result,
      };
    } catch (e) {
      console.error(e);
      context.res = {
        body: e.toString(),
        status: 400,
      };
    }
  };
}

function convertParamsToString(params: any[]) {
  return params.map((param) => {
    if (typeof param === 'string') {
      return param;
    }

    if (typeof param === 'number') {
      return param.toString();
    }

    return JSON.stringify(param);
  });
}
