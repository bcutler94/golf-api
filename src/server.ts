import fastify from 'fastify';
import userHander from './route-handlers/user-hander';
import userSchema from './schemas/user-schema';
import './data-layer/database';
import jwt from 'fastify-jwt';
import middleware from './route-handlers/middleware';
import logger from './util/logger';

/**
 * Server boilerplate
 */
const server = fastify();
server.addHook('onResponse', (request, reply, done) => {
  logger.info({
    req: [request, reply],
  })
})
server.register(jwt, { secret: 'theMostSecretKeyOfAllFuckingTime' });

/**
 * Test Route
 */
server.get('/test', async (req, rep) => {
  rep.send('yo ben')
})


interface SuccessResponse {
  success: true
}

interface ErrorResponse {
  success: false
  errorMessage: string
}

/**
 * User Router
 */
interface PostUserBody {
  ghin: string
  phoneNumber: string
  groupIds: Array<string>
  pushToken: string
}

type APIResponse<Success> = Success & SuccessResponse | ErrorResponse
interface PostUserResponse {
  userId: string
  ghin: string
  groupIds: Array<string>
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
  token: string
}
interface POSTUserRoute {
  Body: PostUserBody
  Reply: APIResponse<PostUserResponse>
}

server.route<POSTUserRoute>({
  method: 'POST',
  url: '/user',
  schema: userSchema.post.schema,
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

interface GetUserResponse {
  userId: string
  ghin: string
  groupIds: Array<string>
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
}

interface GETUserRoute {
  Reply: APIResponse<GetUserResponse>
}

server.route<GETUserRoute>({
  method: 'GET',
  url: '/user',
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
  server.listen(process.env.PORT || 8080, process.env.HOST || '127.0.0.1', (err, address) => {
    if (err) {
      logger.error(err)
      process.exit(1)
    }
    logger.info(`Server listening at ${address}`)
  })
}

export default start