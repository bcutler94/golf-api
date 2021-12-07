import { RouteShorthandOptions } from "fastify"
import { CONTEST_STATUSES, CONTEST_TYPES, PARTICIPANTS_TYPE, RESULT_TYPES, SCORING_TYPE } from "../models/contest-model"

const MAX_CONTEST_PARTICIPANTS = 1000

const post: RouteShorthandOptions = {
  schema: {
    body: {
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
      status: {
        enum: [ ...CONTEST_STATUSES ]
      },
      teeTime: {
        type: 'string',
        format: 'date-time'
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
      }
    },
  }
}

export default {
  post,
}