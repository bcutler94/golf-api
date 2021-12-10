import { RouteShorthandOptions } from "fastify"
import genericSchema from "./generic-schema"

const getQueryStringRequiredKeys = [ 'search' ];

const get: RouteShorthandOptions = {
  schema: {
    // headers: genericSchema.headerAuth,
    querystring: {
      type: 'object',
      maxProperties: getQueryStringRequiredKeys.length,
      required: getQueryStringRequiredKeys,
      properties: {
        ghin: { 
          type: 'string',
          maxLength: 25,
          minLength: 25,
        },
      }
    },
  }
}

export default {
  get
}