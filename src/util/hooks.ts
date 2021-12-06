import { FastifyPluginCallback } from "fastify"
import logger from "./logger"

const hooks: FastifyPluginCallback = (server, opts, done) => {

  server.addHook('onResponse', (request, reply, done) => {
    logger.info({
      req: [request, reply],
    })
  })

  done()
}

export default hooks;