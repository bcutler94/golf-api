import { RouteShorthandOptions } from "fastify"
import { COURSE_VIEWS } from "../models/course-model";
import genericSchema from "./generic-schema"

const getQueryStringRequiredKeys = [ 'search', 'view' ];

const get: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    querystring: {
      type: 'object',
      maxProperties: getQueryStringRequiredKeys.length,
      required: getQueryStringRequiredKeys,
      properties: {
        search: { 
          type: 'string',
          maxLength: 25,
        },
        view: {
          enum: [ ...COURSE_VIEWS ]
        }
      }
    },
  }
}

export default {
  get
}