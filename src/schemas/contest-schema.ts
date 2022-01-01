import { RouteShorthandOptions } from "fastify"
import { CONTEST_VIEW_TYPES, INDIVIDUAL_RESULT_TYPES, PARTICIPANTS_TYPE, SCORING_TYPE, TEAM_RESULT_TYPES } from "../models/contest-model"
import genericSchema from "./generic-schema"

const MAX_CONTEST_PARTICIPANTS = 1000
const MAX_CONTESTS = 10;
export const MAX_STRING_LENGTH = 100;

const postContests: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    body: {
      type: 'object',
      properties: {
        contests: {
          type: "array",
          maxItems: MAX_CONTESTS,
          items: {
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
              resultType: {
                enum: [ ...TEAM_RESULT_TYPES, ...INDIVIDUAL_RESULT_TYPES ]
              },
              participantType: {
                enum: [ ...PARTICIPANTS_TYPE ]
              },
              participants: {
                type: 'array',
                maxLength: MAX_CONTEST_PARTICIPANTS,
                items: {
                  type: 'object',
                  requiredProperties: [ 'fullName', 'firstName', 'lastName', 'clubName', 'id', 'currentHandicap', 'externalId', '_id' ],
                  maxProperties: 8,
                  properties: {
                    firstName: {
                      type: 'string',
                      maxLength: MAX_STRING_LENGTH
                    },
                    lastName: {
                      type: 'string',
                      maxLength: MAX_STRING_LENGTH
                    },
                    club: {
                      type: 'string',
                      maxLength: MAX_STRING_LENGTH
                    },
                    ghin: {
                      type: 'string',
                      maxLength: MAX_STRING_LENGTH
                    },
                  }
                }
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
    }
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

const postStartContest: RouteShorthandOptions = {
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

export default {
  postContests,
  get,
  getUserContests,
  getChildContests,
  postStartContest,
  getContestScorecard,
  postContestScorecard,
  getContestCourse,
}