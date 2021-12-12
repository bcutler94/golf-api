import { FastifyPluginCallback } from "fastify";
import middleware from "../route-handlers/middleware";
import userHander from "../route-handlers/user-hander";
import userSchema from "../schemas/user-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

/**
 * GET
 */
  interface GetUserResponse {
  id: string
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


/**
 * POST
*/
  interface PostUserBody {
  ghin: string
  phoneNumber: string
  groupIds: Array<string>
  pushToken: string
}

interface PostUserResponse {
  id: string
  ghin: string
  groupIds: Array<string>
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
  token: string
}
  export interface POSTUserRoute {
    Body: PostUserBody
    Reply: APIResponse<PostUserResponse>
  }

const userRouter: FastifyPluginCallback = (server, opts, done) => {

  server.route<GETUserRoute>({
    method: 'GET',
    url: '/user',
    preValidation: [middleware.verifyUser],
    handler: async (req, rep) => {
      try {
        const user = await userHander.getUser(req.user.userId)
        logger.info('got user', user.id)
        rep.send({ success: true, data: user });
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
        rep.send({ success: true, data: { ...user, token } });
      } catch (e) {
        logger.error('error POST /user', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });

  done()
}


export default userRouter