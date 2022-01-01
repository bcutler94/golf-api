
import { RouteShorthandOptions } from "fastify"
import { MAX_STRING_LENGTH } from "./contest-schema"
import genericSchema from "./generic-schema"

const patchScorecardTees: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      required: [ 'scorecardId' ],
      maxProperties: 1,
      properties: {
        scorecardId: {
          type: 'string',
          format: 'uuid'
        }
      }
    },
    body: {
      type: 'object',
      required: [ 'tees', 'gender' ],
      maxProperties: 2,
      properties: {
        tees: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        },
        gender: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        }
      }
    }
  }
}

export default {
  patchScorecardTees,
}