import { FastifyPluginCallback } from "fastify";
import middleware from "../route-handlers/middleware";
import userHander from "../route-handlers/user-hander";
import userSchema from "../schemas/user-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

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
  userId: string
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

/**
 * GET
 */
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

const userRouter: FastifyPluginCallback = (server, opts, done) => {

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

  done()
}


export default userRouter