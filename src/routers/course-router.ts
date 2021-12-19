import { FastifyPluginCallback } from "fastify";
import { CourseViews, CourseViewTypes } from "../models/course-model";
import courseHandler from "../route-handlers/course-handler";
import middleware from "../util/middleware";
import courseSchema from "../schemas/course-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

/**
 * GET
 */

type GetCourseResponse = Array<CourseViews[CourseViewTypes]>
interface GETCoursesRoute {
  Querystring: {
    search: string
    view: CourseViewTypes
  }
  Reply: APIResponse<GetCourseResponse>
}

const courseRouter: FastifyPluginCallback = async (server) => {

  server.route<GETCoursesRoute>({
    method: 'GET',
    url: '/courses',
    preValidation: [middleware.verifyUser],
    schema: courseSchema.get.schema,
    handler: async (req, rep) => {
      try {
        const { query: { search, view } } = req;
        const courses = await courseHandler.getCourse(search, view)
        rep.send({ success: true, data: courses })
      } catch (e) {
        logger.error('error GET /courses', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })

  // done()
}

export default courseRouter;