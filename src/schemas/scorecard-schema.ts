
import { RouteShorthandOptions } from "fastify"
import { MAX_STRING_LENGTH } from "./contest-schema"
import genericSchema from "./generic-schema"

const postScorecard: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      type: 'object',
      required: [ 'tees', 'gender', 'contestId', 'courseId' ],
      maxProperties: 4,
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
        },
        courseId: {
          type: 'string',
          format: 'uuid'
        }
      }
    }
  }
}

const getScorecard: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      required: [ 'contestId' ],
      maxProperties: 1,
      properties: {
        contestId: {
          type: 'string',
          format: 'uuid'
        }
      }
    }
  }
}

const patchScore: RouteShorthandOptions = {
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
      required: [ 'score', 'holeIndex' ],
      maxProperties: 2,
      properties: {
        score: {
          type: 'number',
          max: 50,
          min: 1
        },
        holeIndex: {
          type: 'number',
          max: 17,
          min: 0
        }
      }
    }
  }
}



export default {
  postScorecard,
  getScorecard,
  patchScore
}