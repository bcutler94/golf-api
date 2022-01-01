import { RouteShorthandOptions } from "fastify"
import { COURSE_VIEWS } from "../models/course-model";
import genericSchema from "./generic-schema"

const get: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    querystring: {
      type: 'object',
      maxProperties: 25,
      required: [ 'search', 'view' ],
      properties: {
        search: { 
          type: 'string',
          maxLength: 100,
        },
        view: {
          enum: [ ...COURSE_VIEWS ]
        }
      }
    },
  }
}

const getTees: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      maxProperties: 1,
      required: [ 'courseId' ],
      properties: {
        courseId: { 
          type: 'string',
          format: 'uuid',
        },
      }
    },
  }
}

export default {
  get,
  getTees
}