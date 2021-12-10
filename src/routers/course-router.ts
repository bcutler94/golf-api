import { FastifyPluginCallback } from "fastify";
import { ContestStatuses, ContestTypes, ParticipantTypes, ResultTypes, ScoringTypes } from "../models/contest-model";
import courseModel from "../models/course-model";
import contestHandler from "../route-handlers/contest-handler";
import courseHandler from "../route-handlers/course-handler";
import middleware from "../route-handlers/middleware";
import contestSchema from "../schemas/contest-schema";
import courseSchema from "../schemas/course-schema";
import logger from "../util/logger";

/**
 * POST
 */


const courseRouter: FastifyPluginCallback = (server, opts, done) => {

  interface GETCoursesRoute {
    Querystring: {
      search: string
    }
  }

  server.route<GETCoursesRoute>({
    method: 'GET',
    url: '/courses',
    // preValidation: [middleware.verifyUser],
    schema: courseSchema.get.schema,
    handler: async (req, rep) => {
      try {
        const { query: { search } } = req;
        const courses = await courseHandler.getCourse(search)
        rep.send({ courses, success: true })
      } catch (e) {
        logger.error('error GET /courses', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })

  done()
}

export default courseRouter;