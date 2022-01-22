
import { RouteShorthandOptions } from "fastify"
import { MAX_STRING_LENGTH } from "./contest-schema"
import genericSchema from "./generic-schema"

const postScorecard: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      type: 'object',
      required: [ 'tees', 'gender', 'contestId' ],
      maxProperties: 3,
      properties: {
        tees: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        },
        gender: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        },
        contestId: {
          type: 'string',
          format: 'uuid'
        }
      }
    }
  }
}

export default {
  postScorecard,
}