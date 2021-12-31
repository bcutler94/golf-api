import { FastifyPluginCallback } from "fastify";
import { ContestModel, ContestTypes, ContestViews, ContestViewTypes, ContestWithChildren, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestHandler from "../route-handlers/contest-handler";
import middleware from "../util/middleware";
import contestSchema from "../schemas/contest-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { CourseSearchView } from "../models/course-model";
import { ScorecardModel } from "../models/scorecard-model";

/**
 * POST contest
 */
 export interface ContestTeam {
  playerIds: string[]
  name: string
}

export interface ContestPlayer {
  playerId: string
}

export interface Contest {
  numMatches: number
  name: string
  course: CourseSearchView
  players: ContestPlayer[]
  teams: ContestTeam[]
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

/**
 * POST start contest
 */

 interface PatchStartContestReply {}
interface PATCHStartContest {
  Params: {
    contestId: string
  },
  Reply: APIResponse<PatchStartContestReply>
}

/**
 * GET contest scorecards
 */

interface GetScorecardReply {
  scorecard: ScorecardModel | null
}
interface GETContestScorecard {
  Params: {
    contestId: string
  },
  Reply: APIResponse<GetScorecardReply>
}

/**
 * POST create contest scorecard
 */
interface PostScorecardReply {
  scorecard: ScorecardModel
}

interface POSTContestScorecard {
  Params: {
    contestId: string
  },
  Reply: APIResponse<PostScorecardReply>
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
        const contests = await contestHandler.getUserContests(userId, types.split(',') as ContestTypes[], view);
        logger.info('success GET /contests')
        return { 
          success: true, 
          data: { contests } 
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

  server.route<GETChildContests>({
    method: 'GET',
    url: '/contests/:contestId/children',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getChildContests.schema,
    handler: async (req, rep) => {
      try {
        const { params: { contestId } } = req;
        const contest = await contestHandler.getChildContests(contestId);
        logger.info('success GET /contests/:contestId/children', contestId)
        return {
          success: true,
          data: {
            contest
          }
        }
      } catch (e) {
        logger.error('error POST /contests/:contestId/children', e)
        return {
          success: false,
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })

  server.route<PATCHStartContest>({
    method: 'PATCH',
    url: '/contests/:contestId/start',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.postStartContest.schema,
    handler: async (req) => {
      try {
        const { params: { contestId } } = req;
        await contestHandler.startContest(contestId);
        logger.info('success POST /contest/:contestId/start', contestId)
        return { data: {}, success: true }
      } catch (e) {
        logger.error('error POST /contest', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });

  server.route<GETContestScorecard>({
    method: 'GET',
    url: '/contests/:contestId/scorecard',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.getContestScorecard.schema,
    handler: async (req) => {
      try {
        const { params: { contestId }, user: { userId } } = req;
        const scorecard = await contestHandler.getScorecard(contestId, userId)
        logger.info('success GET /contests/:contestId/scorecard', contestId, userId)
        return {
          success: true,
          data: {
            scorecard
          }
        }
      } catch (e) {
        logger.error('error GET /contests/:contestId/scorecard', e)
        return {
          success: false,
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })

  server.route<POSTContestScorecard>({
    method: 'POST',
    url: '/contests/:contestId/scorecard',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.postContestScorecard.schema,
    handler: async (req) => {
      try {
        const { params: { contestId }, user: { userId } } = req;
        const scorecard = await contestHandler.createScorecard(contestId, userId)
        logger.info('success POST /contests/:contestId/scorecard', contestId, userId)
        return {
          success: true,
          data: {
            scorecard
          }
        }
      } catch (e) {
        logger.error('error POST /contests/:contestId/scorecard', e)
        return {
          success: false,
          errorMessage: e instanceof Error ? e.message : 'An error occurred' 
        }
      }
    }
  })





}

export default contestRouter;