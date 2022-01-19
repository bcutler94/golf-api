import { RouteShorthandOptions } from "fastify"
import genericSchema from "./generic-schema"

const post: RouteShorthandOptions = {
  schema: {
    body: {
      type: 'object',
      maxProperties: 5,
      required: [ 'ghin', 'phoneNumber' ],
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
          maxLength: 50,
        },
        contestId: { 
          type: 'string',
          format: 'uuid',
          nullable: true
        },
        referrerUserId: {
          type: 'string',
          format: 'uuid',
          nullable: true
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