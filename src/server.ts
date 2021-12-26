import fastify from 'fastify';
import './data-layer/database';
import jwt from 'fastify-jwt';
import logger from './util/logger';
import userRouter from './routers/user-router';
import contestRouter from './routers/contest-router';
import hooks from './util/hooks';
import database from './data-layer/database';
import courseRouter from './routers/course-router';
import playerRouter from './routers/players-router';
import pubsub from './pubsub/pubsub';
import throng from 'throng';

interface SuccessResponse<JSON> {
  success: true
  data: JSON
}

interface ErrorResponse {
  success: false
  errorMessage: string
}

export type APIResponse<JSON> = SuccessResponse<JSON> | ErrorResponse

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

/**
 * Test Route
 */
server.get('/test', async (req, rep) => rep.send('yo ben'))

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
 * Player Route
 */
server.register(playerRouter, { prefix: 'v1' })


const start = async () => {
  await database.startDB();
  await pubsub.startPubSub({ attachListeners: true });
  
  server.listen(process.env.PORT || 8080, process.env.HOST || '127.0.0.1', (err, address) => {
    if (err) {
      logger.error(err)
      process.exit(1)
    }
    logger.info(`Server listening at ${address}`)
  })
}

throng(start)