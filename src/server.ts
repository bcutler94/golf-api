import fastify from 'fastify';
import userHander from './route-handlers/user-hander';
import userSchema, { GetUser, PostUser } from './schemas/user-schema';
import './data-layer/database';
import jwt from 'fastify-jwt';
import middleware from './route-handlers/middleware';
import logger from './util/logger';

const server = fastify();
server.addHook('onResponse', (request, reply, done) => {
  logger.info({
    req: [request, reply],
  })
})
server.register(jwt, { secret: 'theMostSecretKeyOfAllFuckingTime' });

server.get('/test', async (req, rep) => {
  rep.send('yo ben')
})

/**
 * User Router
 */
server.route<PostUser>({
  method: 'POST',
  url: '/user',
  schema: userSchema.post,
  handler: async (req, rep) => {
    try {
      const { body } = req;
      const user = await userHander.createUser(body);
      const token = server.jwt.sign({ userId: user.userId });
      rep.send({ ...user, success: true, token });
    } catch (e) {
      logger.error('error POST /user', e)
      rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
    }
  }
});

server.route<GetUser>({
  method: 'GET',
  url: '/user',
  schema: userSchema.get,
  preValidation: [middleware.verifyUser],
  handler: async (req, rep) => {
    try {
      const user = await userHander.getUser(req.user.userId)
      rep.send({ ...user, success: true });
    } catch (e) {
      logger.error('error GET /user', e)
      rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
    }
  }
});


const start = () => {
  server.listen(process.env.PORT || 8080, (err, address) => {
    if (err) {
      logger.error(err)
      process.exit(1)
    }
    logger.info(`Server listening at ${address}`)
  })
}

export default start