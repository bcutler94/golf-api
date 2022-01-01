import { FastifyPluginCallback } from "fastify";
import { ContestModel, ContestTypes, ContestViews, ContestViewTypes, ContestWithChildren, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestHandler from "../route-handlers/contest-handler";
import middleware from "../util/middleware";
import contestSchema from "../schemas/contest-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { CourseModel, CourseSearchView } from "../models/course-model";
import { ScorecardModel } from "../models/scorecard-model";
import scorecardSchema from "../schemas/scorecard-schema";
import scorecardHandler from "../route-handlers/scorecard-handler";


/**
 * PATCH select tees
 */

interface PatchScorecardTeesReply {
  scorecard: ScorecardModel
}

interface PATCHScorecardTees {
  Params: {
    scorecardId: string
  },
  Body: {
    tees: string
    gender: string
  }
  Reply: APIResponse<PatchScorecardTeesReply>
}


const scorecardRouter: FastifyPluginCallback = async (server) => {


  server.route<PATCHScorecardTees>({
    method: 'PATCH',
    url: '/scorecards/:scorecardId/tees',
    preValidation: [middleware.verifyUser],
    schema: scorecardSchema.patchScorecardTees.schema,
    handler: async (req) => {
      try {
        const { params: { scorecardId }, body: { tees, gender } } = req;
        const scorecard = await scorecardHandler.setTees(scorecardId, tees, gender)
        logger.info('success PATCH /scorecards/:scorecardId/tees', scorecardId, tees, gender)
        return { data: { scorecard }, success: true }
      } catch (e) {
        logger.error('success PATCH /scorecards/:scorecardId/tees', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  });



}

export default scorecardRouter;