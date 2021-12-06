import { RouteShorthandOptions } from "fastify"
import { SUPPORTED_CONTEST_TYPES } from "../models/contest-model"
import helpers from "../util/helpers"

// type: 'matchup'
// status: ContestStatuses
// contestId: string
// teeTime: string
// courseId: string
// scorecardIds: Array<string>
// results: Results[T]

// interface MatchPlayResults {
//   winningScorecardId: string
//   holesPlayed: number
//   score: string // '2 up' | 'AS' | '1 down'
// }


const post: RouteShorthandOptions = {
  schema: {
    body: {
      contestType: {
        type: 'string',
        maxLength: 20,
        pattern: helpers.arrayToRegex([ ...SUPPORTED_CONTEST_TYPES ])
      },
      courseId: {
        type: 'string',
        format: 'uuid'
      },
      teeTime: {
        type: 'string',
        format: 'date-time'
      }
    },
  }
}

export default {
  post,
}