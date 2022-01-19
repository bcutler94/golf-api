import { FastifyPluginCallback } from "fastify";
import middleware from "../util/middleware";
import userHander from "../route-handlers/user-hander";
import userSchema from "../schemas/user-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { UserModel } from "../models/user-model";

/**
 * GET
 */
interface GETUserRoute {
  Reply: APIResponse<{ user: UserModel | undefined }>
}

/**
 * POST
*/
interface PostUserBody {
  ghin: string
  phoneNumber: string
  contestId?: string
  referrerUserId?: string
  pushToken?: string
}
  export interface POSTUserRoute {
    Body: PostUserBody
    Reply: APIResponse<{ user: UserModel, token: string }>
  }

const userRouter: FastifyPluginCallback = async (server, opts, done) => {

  server.route<GETUserRoute>({
    method: 'GET',
    url: '/user',
    preValidation: [middleware.verifyUser],
    handler: async (req, rep) => {
      try {
        const { user: { userId } } = req;
        logger.info('userId', userId)
        const user = await userHander.getUser(userId)
        logger.info('got user', user?.id)
        rep.send({ success: true, data: { user } });
      } catch (e) {
        logger.error('error GET /user', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });

  server.route<POSTUserRoute>({
    method: 'POST',
    url: '/user',
    schema: userSchema.post.schema,
    handler: async (req, rep) => {
      try {
        const { body } = req;
        const user = await userHander.createUser(body);
        const token = server.jwt.sign({ userId: user.id });
        rep.send({ success: true, data: { user, token } });
      } catch (e) {
        logger.error('error POST /user', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });

  
}


export default userRouter