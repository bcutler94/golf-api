import { RouteShorthandOptions } from "fastify"
import { SCORING_TYPE } from "../models/contest-model"
import genericSchema from "./generic-schema"

const MAX_CONTESTS = 10;
export const MAX_STRING_LENGTH = 100;

const postContest: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      type:  'object',
      properties: {
        numMatches: {
          type: 'number',
          max: MAX_CONTESTS
        },
        name: {
          type: 'string',
          maxLength: MAX_STRING_LENGTH
        },
        scoringType: {
          enum: [ ...SCORING_TYPE ]
        },
        course: {
          type: 'object',
          requiredProperties: [ 'id', 'fullName', 'city', 'state' ],
          maxProperties: 4,
          properties: {
            id: { // this should be uuid format but client can send empty string 
              type: 'string',
              maxLength: MAX_STRING_LENGTH
            },
            fullName: {
              type: 'string',
              maxLength: MAX_STRING_LENGTH
            },
            city: {
              type: 'string',
              maxLength: MAX_STRING_LENGTH
            },
            state: {
              type: 'string',
              maxLength: 2
            }
          }
        }
      }
    }
  }
}

const getContest: RouteShorthandOptions = {
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

const getUserContestRequiredQPs = ['view']

const getUserContests: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth
  }
}

const getChildContests: RouteShorthandOptions = {
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

const patchStartContest: RouteShorthandOptions = {
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

const getContestScorecard: RouteShorthandOptions = {
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

const postContestScorecard: RouteShorthandOptions = {
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

const getContestCourse: RouteShorthandOptions = {
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

const patchContestTeam: RouteShorthandOptions = {
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

export default {
  postContest,
  getContest,
  patchContestTeam,
  getUserContests,
  patchStartContest,
  // getChildContests,
  // getContestScorecard,
  // postContestScorecard,
  // getContestCourse,
}