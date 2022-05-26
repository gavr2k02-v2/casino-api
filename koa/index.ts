import { existsSync, readdirSync } from 'fs';
import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';
import koaCors from 'koa-cors';
import koaBody from 'koa-body';
import { importFuncs, readSettings } from './utils';

readSettings('./local.settings.json');

const app = new Koa();
const router = new Router();

app.use(koaCors());
app.use(koaBody({ multipart: true }));

const dirs = readdirSync('.').filter((dir) => existsSync(path.join(dir, 'function.json')));
importFuncs(dirs, router);

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7071;
console.log(`Start web server, port: ${port}`);
app.listen(port);
