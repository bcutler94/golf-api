import { WithId } from 'mongodb';
import database from '../data-layer/database';
import db from '../data-layer/database';

export const CONTEST_TYPES = [
  'matchup'
] as const;

export const RESULT_TYPES = [
  'match-play'
] as const;

export const CONTEST_STATUSES = [
  'queued',
  'active',
  'closed',
  'canceled'
] as const;

export const SCORING_TYPE = [
  'gross',
  'net'
] as const;

export const PARTICIPANTS_TYPE = [
  'individual',
  'team'
] as const;

export type ParticipantTypes = typeof PARTICIPANTS_TYPE[number]

export type ScoringTypes = typeof SCORING_TYPE[number]

export type ContestStatuses = typeof CONTEST_STATUSES[number]

export type ContestTypes = typeof CONTEST_TYPES[number]

export type ResultTypes = typeof RESULT_TYPES[number]

export interface MatchPlayResults {
  resultType: 'match-play'
  winningScorecardId: string
  holesPlayed: number
  score: string // '2 up' | 'AS' | '1 down'
}

export interface Results {
  'match-play': MatchPlayResults
}

export interface Individual {
  participantType: 'individual'
  playerIds: Array<string>
}
export interface Team {
  participantType: 'team'
  teamIds: Array<string>
}

export interface Participants {
  'individual': Individual
  'team': Team
}

export interface ContestModel<R extends ResultTypes, P extends ParticipantTypes> {
  id: string
  adminId: string
  contestType: ContestTypes // do i need this?
  scoringType: ScoringTypes
  status: ContestStatuses
  teeTime: string
  courseId: string
  scorecardIds: Array<string>
  results: Results[R]
  participants: Participants[P]
  parentContestId: string | null
  payoutId: string | null
}


export type ContestModelObject<R extends ResultTypes, P extends ParticipantTypes> = WithId<ContestModel<R, P>>

const contestCollection = database.db.collection<ContestModel<ResultTypes, ParticipantTypes>>('contests');


const createContest = async (contest: ContestModel<ResultTypes, ParticipantTypes>): Promise<ContestModel<ResultTypes, ParticipantTypes>> => {
  const { acknowledged } = await contestCollection.insertOne(contest);
  if (acknowledged) return contest;
  throw new Error ('There was an error creating the contest [model]');
}

const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
  const contest = await contestCollection.findOne({ contestId });
  if (!contest) throw new Error ('There was an error getting the contest [model]')
  return contest;
}


export default {
  createContest,
  getContest
}