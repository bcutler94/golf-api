import { FastifyPluginCallback } from "fastify";
import { ContestStatuses, ContestTypes, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import contestSchema from "../schemas/contest-schema";
import logger from "../util/logger";

/**
 * POST
 */
interface PostContestBody {
  adminId: string
  contestType: ContestTypes
  scoringType: ScoringTypes
  status: ContestStatuses
  teeTime: string
  courseId: string
  resultType: ResultTypes
  participantType: ParticipantTypes
  participantIds: Array<string>
}

interface PostContestReply {}

interface POSTContestRoute {
  Body: PostContestBody
  Reply: PostContestReply
}


const contestRouter: FastifyPluginCallback = (server, opts, done) => {

  server.route<POSTContestRoute>({
    method: 'POST',
    url: '/contest',
    schema: contestSchema.post.schema,
    handler: async (req, rep) => {
      try {
        // TODO stuff here
      } catch (e) {
        logger.error('error POST /contest', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  });

  done()
}

export default contestRouter;