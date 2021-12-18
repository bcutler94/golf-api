import { RouteShorthandOptions } from "fastify"
import { CONTEST_STATUSES, CONTEST_VIEW_TYPES, PARTICIPANTS_TYPE, RESULT_TYPES, SCORING_TYPE } from "../models/contest-model"
import genericSchema from "./generic-schema"

const MAX_CONTEST_PARTICIPANTS = 1000

const postBodyRequiredKeys = ['name', 'scoringType', 'teeTime', 'courseId', 'resultType', 'participantType', 'participantIds', 'parentContestId', 'payoutId'];
const post: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      errorMessage: 'There was an error',
      type: 'object',
      required: postBodyRequiredKeys,
      maxProperties: 25,
      properties: {
        name: {
          type: 'string',
          maxLength: 15,
          minLength: 3
        },
        adminId: {
          type: 'string',
          format: 'uuid'
        },
        scoringType: {
          enum: [ ...SCORING_TYPE ]
        },
        teeTime: {
          type: 'string',
          nullable: true
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
      maxProperties: 25,
      properties: {
        type: 'string',
        format: 'uuid'
      }
    }
  }
}

const getUserContestRequiredQPs = ['view']

const getUserContests: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    querystring: {
      type: 'object',
      required: getUserContestRequiredQPs,
      maxProperties: 25,
      properties: {
        view: {
          enum: [ ...CONTEST_VIEW_TYPES ]
        }
      }
    },
  }
}

export default {
  post,
  get,
  getUserContests
}