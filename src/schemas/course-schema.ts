import { RouteShorthandOptions } from "fastify"
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
          maxLength: 100,
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

export default {
  search,
  geolocate,
  getTees
}