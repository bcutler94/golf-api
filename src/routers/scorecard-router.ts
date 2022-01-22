import { FastifyPluginCallback } from "fastify";
import middleware from "../util/middleware";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { ScorecardModel } from "../models/scorecard-model";
import scorecardSchema from "../schemas/scorecard-schema";
import scorecardHandler from "../route-handlers/scorecard-handler";


/**
 * POST create scorecard
 */

interface POSTScorecard {
  Body: {
    contestId: string
    tees: string
    gender: string
    courseId: string
  }
  Reply: APIResponse<{
    scorecard: ScorecardModel
  }>
}

/**
 * GET scorecard
 */
interface GETScorecard {
  Params: {
    contestId: string
  }
  Reply: APIResponse<{
    scorecard: ScorecardModel | null
  }>
}

const scorecardRouter: FastifyPluginCallback = async (server) => {


  server.route<POSTScorecard>({
    method: 'POST',
    url: '/scorecard',
    preValidation: [middleware.verifyUser],
    schema: scorecardSchema.postScorecard.schema,
    handler: async (req) => {
      try {
        const { body: { tees, gender, contestId, courseId }, user: { userId } } = req;
        const scorecard = await scorecardHandler.createScorecard(userId, contestId, tees, gender, courseId)
        logger.info('success POST /scorecards/:scorecardId', userId, contestId, tees, gender)
        return { data: { scorecard }, success: true }
      } catch (e) {
        logger.error('success POST /scorecards/:scorecardId', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });

  server.route<GETScorecard>({
    method: 'GET',
    url: '/scorecards/contest/:contestId',
    preValidation: [middleware.verifyUser],
    schema: scorecardSchema.postScorecard.schema,
    handler: async (req) => {
      try {
        const { params: { contestId }, user: { userId } } = req;
        const scorecard = await scorecardHandler.getContestScorecard(contestId, userId)
        logger.info('success GET /scorecards/contest/:contestId', contestId, userId)
        return { data: { scorecard }, success: true }
      } catch (e) {
        logger.error('success GET /scorecards/contest/:contestId', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });





}

export default scorecardRouter;