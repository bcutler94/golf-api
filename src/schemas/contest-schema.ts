import { RouteShorthandOptions } from "fastify"
import { CONTEST_STATUSES, CONTEST_TYPES, PARTICIPANTS_TYPE, RESULT_TYPES, SCORING_TYPE } from "../models/contest-model"
import genericSchema from "./generic-schema"

const MAX_CONTEST_PARTICIPANTS = 1000

const postBodyRequiredKeys = ['adminId', 'contestType', 'scoringType', 'teeTime', 'courseId', 'resultType', 'participantType', 'participantIds', 'parentContestId', 'payoutId'];
const post: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      type: 'object',
      maxProperties: postBodyRequiredKeys.length,
      required: postBodyRequiredKeys,
      properties: {
        adminId: {
          type: 'string',
          format: 'uuid'
        },
        contestType: {
          enum: [ ...CONTEST_TYPES ]
        },
        scoringType: {
          enum: [ ...SCORING_TYPE ]
        },
        teeTime: {
          type: 'string',
          // format: 'string' TODO
        },
        courseId: {
          type: 'string',
          format: 'uuid'
        },
        resultType: {
          enum: [ ...RESULT_TYPES ]
        },
        participantType: {
          enum: [ ...PARTICIPANTS_TYPE ]
        },
        participantIds: {
          type: "array",
          maxItems: MAX_CONTEST_PARTICIPANTS,
          uniqueItems: true,
          items: {
            type:  'string',
            format: 'uuid'
          }
        },
        parentContestId: {
          type: 'string',
          nullable: true,
          format: 'uuid'
        },
        payoutId: {
          type: 'string',
          nullable: true,
          format: 'uuid'
        }
      }
    },
  }
}

const getParamsRequiredKeys = ['contestId'];
const get: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      required: getParamsRequiredKeys,
      maxProperties: getParamsRequiredKeys.length,
      properties: {
        type: 'string',
        format: 'uuid'
      }
    }
  }
}

export default {
  post,
  get
}