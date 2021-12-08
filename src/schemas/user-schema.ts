import { RouteShorthandOptions } from "fastify"
import genericSchema from "./generic-schema"

const postBodyRequiredKeys = [ 'ghin', 'phoneNumber', 'pushToken', 'groupIds' ];
const post: RouteShorthandOptions = {
  schema: {
    body: {
      type: 'object',
      maxProperties: postBodyRequiredKeys.length,
      required: postBodyRequiredKeys,
      properties: {
        ghin: { 
          type: 'string',
          maxLength: 7,
          minLength: 7,
        },
        phoneNumber: {
          type: 'string',
          maxLength: 10,
          minLength: 10,
        },
        pushToken: {
          type: 'string',
          maxLength: 50
        },
        groupIds: { 
          type: 'array',
          maxItems: 5,
          items: {
            type: 'string'
          }
        }
      }
    },
  }
}

const get: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth
  }
}

export default {
  post,
  get
}