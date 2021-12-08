import { FastifyPluginCallback } from "fastify";
import { ContestStatuses, ContestTypes, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestHandler from "../route-handlers/contest-handler";
import middleware from "../route-handlers/middleware";
import contestSchema from "../schemas/contest-schema";
import logger from "../util/logger";

/**
 * POST
 */
interface PostContestBody {
  adminId: string
  contestType: ContestTypes
  scoringType: ScoringTypes
  teeTime: string
  courseId: string
  resultType: ResultTypes
  participantType: ParticipantTypes
  participantIds: Array<string>
  payoutId: string | null
}

interface PostContestReply {}

export interface POSTContestRoute {
  Body: PostContestBody
  Reply: PostContestReply
}

const contestRouter: FastifyPluginCallback = (server, opts, done) => {

  server.route<POSTContestRoute>({
    method: 'POST',
    url: '/contest',
    preValidation: [middleware.verifyUser],
    schema: contestSchema.post.schema,
    handler: async (req, rep) => {
      try {
        const { body } = req;
        const contest = await contestHandler.createContest(body);
        rep.send({ ...contest, success: true })
      } catch (e) {
        logger.error('error POST /contest', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });


  interface GetContestParams {
    contestId: string
  }

  interface GetContestReply {}
  interface GETContestRoute {
    Params: GetContestParams,
    Reply: GetContestReply
  }

  server.route<GETContestRoute>({
    method: 'GET',
    url: '/contest/:contestId',
    preValidation: [middleware.verifyUser],
    handler: async (req, rep) => {
      try {
        const { params: { contestId } } = req;
        const contest = await contestHandler.getContest(contestId);
        rep.send({ ...contest, success: true })
      } catch (e) {
        logger.error('error POST /contest', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })

  done()
}

export default contestRouter;