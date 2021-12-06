import { WithId } from 'mongodb';
import db from '../data-layer/database';

export const SUPPORTED_CONTEST_TYPES = [
  'matchup'
] as const;

export const SUPPORTED_RESULT_TYPES = [
  'match-play'
] as const;

export const CONTEST_STATUSES = [
  'queued',
  'active',
  'closed'
] as const;

const SCORING_TYPE = [
  'gross',
  'net'
] as const;

type ScoringTypes = typeof SCORING_TYPE[number]

type ContestStatuses = typeof CONTEST_STATUSES[number]

type ContestTypes = typeof SUPPORTED_CONTEST_TYPES[number]

type ContestResults = typeof SUPPORTED_RESULT_TYPES[number]

interface MatchupContest<T extends ContestResults> {
  contestType: ContestTypes
  scoringType: ScoringTypes
  status: ContestStatuses
  contestId: string
  teeTime: string
  courseId: string
  scorecardIds: Array<string>
  results: Results[T]
}

interface Contests<T extends ContestResults> {
  'matchup': MatchupContest<T>
}

interface MatchPlayResults {
  resultType: 'match-play'
  winningScorecardId: string
  holesPlayed: number
  score: string // '2 up' | 'AS' | '1 down'
}

interface Results {
  'match-play': MatchPlayResults
}

export interface ContestModel<T extends ContestTypes, R extends ContestResults> {
  type: T
  data: Contests<R>[T]
}

export type ContestModelObject<T extends ContestTypes, R extends ContestResults> = WithId<ContestModel<T, R>>

const createContest = async (contest): Promise<ContestModel> => {

}

const updateContest = async (update): Promise<ContestModel> => {

}


export default {
  createContest,
  updateContest
}