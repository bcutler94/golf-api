import { RouteShorthandOptions } from "fastify"
import { MAX_STRING_LENGTH } from "./contest-schema"
import genericSchema from "./generic-schema"

const search: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      maxProperties: 1,
      required: [ 'searchTerm' ],
      properties: {
        searchTerm: { 
          type: 'string',
          maxLength: MAX_STRING_LENGTH,
        },
      }
    },
  }
}

const geolocate: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      maxProperties: 2,
      required: [ 'lat', 'long' ],
      properties: {
        lat: { 
          type: 'number',
        },
        long: { 
          type: 'number',
        },
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

const getCourseByTees: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      maxProperties: 3,
      required: [ 'courseId' ],
      properties: {
        courseId: { 
          type: 'string',
          format: 'uuid',
        },
        tees: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        },
        gender: {
          enum: ['Male', 'Female']
        }
      }
    },
  }
}

export default {
  search,
  geolocate,
  getTees,
  getCourseByTees
}