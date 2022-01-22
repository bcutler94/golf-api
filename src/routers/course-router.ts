import { FastifyPluginCallback } from "fastify";
import courseHandler from "../route-handlers/course-handler";
import middleware from "../util/middleware";
import courseSchema from "../schemas/course-schema";
import { APIResponse } from "../server";
import logger from "../util/logger";
import { CourseSearchView, CourseTees } from "../models/course-model";

/**
 * GET search courses
 */

interface GETsearchCourses{
  Params: {
    searchTerm: string
  }
  Reply: APIResponse<{ courses: CourseSearchView[] }>
}

/**
 * GET geolocate courses
 */

 interface GETgeolocateCourses {
  Params: {
    lat: number
    long: number
  }
  Reply: APIResponse<{ courses: CourseSearchView[] }>
}

/**
 * GET course tees
 */
interface GetCourseTeesResponse {
  tees: CourseTees
}
interface GETCourseTeeRoute {
  Params: {
    courseId: string
  }
  Reply: APIResponse<GetCourseTeesResponse>
}
 

const courseRouter: FastifyPluginCallback = async (server) => {

  server.route<GETsearchCourses>({
    method: 'GET',
    url: '/courses/search/:searchTerm',
    preValidation: [middleware.verifyUser],
    schema: courseSchema.search.schema,
    handler: async (req) => {
      try {
        const { params: { searchTerm } } = req;
        const courses = await courseHandler.getCourse(searchTerm);
        logger.info('success GET /courses/search', searchTerm)
        return { success: true, data: { courses } }
      } catch (e) {
        logger.error('error GET /courses/search', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  })

  server.route<GETgeolocateCourses>({
    method: 'GET',
    url: '/courses/lat/:lat/long/:long',
    preValidation: [middleware.verifyUser],
    schema: courseSchema.geolocate.schema,
    handler: async (req) => {
      try {
        const { params: { lat, long } } = req;
        const courses = await courseHandler.geolocateCourses(lat, long);
        logger.info('success GET /courses/lat/long', lat, long)
        return { success: true, data: { courses } }
      } catch (e) {
        logger.error('error GET /courses/lat/long')
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
        const tees = await courseHandler.getTees(courseId)
        logger.info('success GET /courses/:courseId/tees', courseId)
        return { success: true, data: { tees } }
      } catch (e) {
        logger.error('error GET /courses/:courseId/tees', e)
        return { success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' }
      }
    }
  })

}

export default courseRouter;