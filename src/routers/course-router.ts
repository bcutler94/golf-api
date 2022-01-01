import { FastifyPluginCallback } from "fastify";
import { CourseTeeView, CourseViews, CourseViewTypes } from "../models/course-model";
import courseHandler from "../route-handlers/course-handler";
import middleware from "../util/middleware";
import courseSchema from "../schemas/course-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";

/**
 * GET search courses
 */

type GetCourseResponse = Array<CourseViews[CourseViewTypes]>
interface GETCoursesRoute {
  Querystring: {
    search: string
    view: CourseViewTypes
  }
  Reply: APIResponse<GetCourseResponse>
}

/**
 * GET course tees
 */
interface GetCourseTeesResponse {
  course: CourseTeeView
}
interface GETCourseTeeRoute {
  Params: {
    courseId: string
  }
  Reply: APIResponse<GetCourseTeesResponse>
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
        const courses = await courseHandler.getCourse(search, view);
        logger.info('success GET /courses', search, view)
        return { success: true, data: courses }
      } catch (e) {
        logger.error('error GET /courses', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  })

  server.route<GETCourseTeeRoute>({
    method: 'GET',
    url: '/courses/:courseId/tees',
    preValidation: [middleware.verifyUser],
    schema: courseSchema.getTees.schema,
    handler: async (req) => {
      try {
        const { params: { courseId } } = req;
        const course = await courseHandler.getTees(courseId)
        logger.info('success GET /courses/:courseId/tees', courseId)
        return { success: true, data: { course } }
      } catch (e) {
        logger.error('error GET /courses/:courseId/tees', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  })

}

export default courseRouter;