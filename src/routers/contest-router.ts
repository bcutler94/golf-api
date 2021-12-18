import { FastifyPluginCallback } from "fastify";
import { ContestModel, ContestViews, ContestViewTypes, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestHandler from "../route-handlers/contest-handler";
import middleware from "../route-handlers/middleware";
import contestSchema from "../schemas/contest-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

/**
 * POST contest
 */
interface PostContestBody {
  name: string
  scoringType: ScoringTypes
  teeTime: string | null
  courseId: string
  resultType: ResultTypes
  participantType: ParticipantTypes
  participantIds: Array<string>
  payoutId: string | null
  parentContestId: string | null
}

interface PostContestReply {
  contestId: string
}

export interface POSTContestRoute {
  Body: PostContestBody
  Reply: APIResponse<PostContestReply>
}

/**
 * GET contest
 */
 interface GetContestParams {
  contestId: string
}

interface GetContestReply {
  contest: ContestModel<ResultTypes, ParticipantTypes>
}
interface GETContestRoute {
  Params: GetContestParams,
  Reply: APIResponse<GetContestReply>
}

/**
 * GET user contests
 */

interface GetUserContestReply {
  contests: ContestViews[ContestViewTypes][]
}
interface GETUserContests {
  Querystring: {
    search: string
    view: ContestViewTypes
  }
  Reply: APIResponse<GetUserContestReply>
}


const contestRouter: FastifyPluginCallback = async (server) => {

  server.route<POSTContestRoute>({
    method: 'POST',
    url: '/contest',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.post.schema,
    handler: async (req, rep) => {
      try {
        const { body, user: { userId } } = req;
        // const contestId = await contestHandler.createContest(userId, body);
        logger.info('POST /contest', userId)
        return { data: { contestId: '' }, success: true }
        // return rep.send({ data: { contestId }, success: true })
      } catch (e) {
        logger.error('error POST /contest', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }

        // rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });

  // server.route<GETContestRoute>({
  //   method: 'GET',
  //   url: '/contest/:contestId',
  //   preValidation: [middleware.verifyUser],
  //   handler: async (req, rep) => {
  //     try {
  //       const { params: { contestId } } = req;
  //       const contest = await contestHandler.getContest(contestId);
  //       rep.send({ success: true, data: { contest } })
  //     } catch (e) {
  //       logger.error('error POST /contest', e)
  //       rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
  //     }
  //   }
  // })

  server.route<GETUserContests>({
    method: 'GET',
    url: '/contests',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getUserContests.schema,
    handler: async (req, rep) => {
      try {
        const { user: { userId }, query: { view } } = req;
        const contests = await contestHandler.getUserContests(userId, view);
        rep.send({ success: true, data: { contests } })
      } catch (e) {
        logger.error('error POST /contest', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })



  // done()
}

export default contestRouter;