import { WithId } from 'mongodb';
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
  'closed'
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

interface MatchPlayResults {
  resultType: 'match-play'
  winningScorecardId: string
  holesPlayed: number
  score: string // '2 up' | 'AS' | '1 down'
}

interface Results {
  'match-play': MatchPlayResults
}

interface Individual {
  participantType: 'individual'
  playerIds: Array<string>
}

interface Team {
  participantType: 'team'
  teamIds: Array<string>
}

interface Participants {
  'individual': Individual
  'team': Team
}

interface ContestModel<R extends ResultTypes, P extends ParticipantTypes> {
  adminId: string
  contestType: ContestTypes // do i need this?
  scoringType: ScoringTypes
  status: ContestStatuses
  contestId: string
  teeTime: string
  courseId: string
  scorecardIds: Array<string>
  results: Results[R]
  participants: Participants[P]
  parentContestId: string | null
}


export type ContestModelObject<R extends ResultTypes, P extends ParticipantTypes> = WithId<ContestModel<R, P>>

const getContestCollection = <R extends ResultTypes, P extends ParticipantTypes>() => db.collection<ContestModel<R, P>>('contests');

const createContest = async <R extends ResultTypes, P extends ParticipantTypes>(contest: ContestModel<R, P>) => {
  return await getContestCollection<R, P>().insertOne(contest);
}



export default {
  createContest,
}