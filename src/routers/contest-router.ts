import { FastifyPluginCallback } from "fastify";
import { ContestModel, ContestTypes, ContestViews, ContestViewTypes, ContestWithChildren, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestHandler from "../route-handlers/contest-handler";
import middleware from "../util/middleware";
import contestSchema from "../schemas/contest-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { CourseSearchView } from "../models/course-model";

/**
 * POST contest
 */
export interface ContestPlayer {
  firstName: string
  lastName: string
  club: string
  ghin: string
}

 export interface Contest {
  numMatches: number
  name: string
  course: CourseSearchView
  participants: ContestPlayer[]
  participantType: ParticipantTypes
  resultType: ResultTypes
  scoringType: ScoringTypes
}
export interface PostContestBody {
  contests: Contest[]
}

interface PostContestReply {}

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
  contest: ContestModel
}
interface GETContestRoute {
  Params: {
    contestId: string
  },
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
    types: string
    view: ContestViewTypes
  }
  Reply: APIResponse<GetUserContestReply>
}

/**
 * GET child contests
 */

interface GetContestWithChildrenReply { 
  contest: ContestWithChildren 
}
interface GETChildContests {
  Params: {
    contestId: string
  },
  Reply: APIResponse<GetContestWithChildrenReply>
}

const contestRouter: FastifyPluginCallback = async (server) => {

  server.route<POSTContestRoute>({
    method: 'POST',
    url: '/contest',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.postContests.schema,
    handler: async (req, rep) => {
      try {
        const { body: { contests }, user: { userId } } = req;
        logger.info(contests, req.body)
        await contestHandler.createContests(userId, contests);
        logger.info('success POST /contest', userId)
        return { data: {}, success: true }
      } catch (e) {
        logger.error('error POST /contest', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
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
        const { user: { userId }, query: { view, types } } = req;
        logger.info(types)
        const contests = await contestHandler.getUserContests(userId, types.split(',') as ContestTypes[], view);
        rep.send({ success: true, data: { contests } })
      } catch (e) {
        logger.error('error POST /contest', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })

  server.route<GETChildContests>({
    method: 'GET',
    url: '/contests/:contestId/children',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getChildContests.schema,
    handler: async (req, rep) => {
      try {
        const { params: { contestId } } = req;
        const contest = await contestHandler.getChildContests(contestId);
        return {
          success: true,
          data: {
            contest
          }
        }
      } catch (e) {
        logger.error('error POST /contest', e)
        return {
          success: false,
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })

}

export default contestRouter;