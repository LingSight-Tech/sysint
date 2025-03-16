import Koa from 'koa'
import { bodyParser } from '@koa/bodyparser'
import cors from '@koa/cors'
import { defaultStaticJsonFileConfigCenter as config } from './infra/config/bootstrap.mjs'
import { router } from './router/index.mjs'
import { amapProxy } from './middleware/index.mjs'


const mainApp = new Koa()
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(amapProxy)
  ;

mainApp.listen(config.get('server.port'), () => {
  console.log(`Server started at ${config.get('server.port')}`);
})