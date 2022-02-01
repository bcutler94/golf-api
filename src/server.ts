import fastify, { FastifyServerOptions } from 'fastify';
import './data-layer/database';
import jwt from 'fastify-jwt';
import logger from './util/logger';
import userRouter from './routers/user-router';
import contestRouter from './routers/contest-router';
import database from './data-layer/database';
import courseRouter from './routers/course-router';
import playerRouter from './routers/players-router';
import throng from 'throng';
import scorecardRouter from './routers/scorecard-router';
import Etag from 'fastify-etag';

interface SuccessResponse<JSON> {
  success: true
  data: JSON
}

interface ErrorResponse {
  success: false
  errorMessage: string
}

export type APIResponse<JSON> = SuccessResponse<JSON> | ErrorResponse

const options: { [key: string]: boolean } = {}
if (process.env.ENABLE_HTTP2 === 'yes') options.http2 = true;

const server = fastify();
/**
 * Register hooks/middleware
 */
// server.register(hooks)
server.setErrorHandler((e, request, rep) => {
  rep.status(200).send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
})
server.register(require('fastify-compress'))
server.register(jwt, { secret: process.env.JWT_SECRET || 'theMostSecretKeyOfAllFuckingTime' });
server.register(Etag)

/**
 * Test Route
 */
server.get('/test', async (_, rep) => {
  rep.header('Cache-Control', 'public, max-age=86400')
  return 'yo ben'
})

/**
 * User Router
 */
server.register(userRouter, { prefix: 'v1' })

/**
 * Contest Router
 */
server.register(contestRouter, { prefix: 'v1' })

/**
 * Courses Router
 */
server.register(courseRouter, { prefix: 'v1' })

/**
 * Player Router
 */
server.register(playerRouter, { prefix: 'v1' })

/**
 * Scorecard Router
 */
server.register(scorecardRouter, { prefix: 'v1' })

const start = async () => {
  await database.startDB();
  
  server.listen(process.env.PORT || 8080, process.env.HOST || '127.0.0.1', (err, address) => {
    if (err) {
      logger.error(err)
      process.exit(1)
    }
    logger.info(`Server listening at ${address}`)
  })
}

process.env.SHOULD_THREAD === 'yes' ? throng(start) : start()
