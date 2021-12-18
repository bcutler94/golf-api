import { WithId, Document, AggregationCursor } from 'mongodb';
import database from '../data-layer/database';

export const CONTEST_VIEW_TYPES = [
  'preview'
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

export type ContestViewTypes = typeof CONTEST_VIEW_TYPES[number]

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
  homePlayerId: string | null
  userIds: Array<string>
}
export interface Team {
  participantType: 'team'
  homeTeamId: string | null
  teamIds: Array<string>
}

export interface Participants {
  'individual': Individual
  'team': Team
}

export interface ContestPreView {
  id: string
  name: string
  status: ContestStatuses
  teeTime: string | null
  numParticipants: number
  courseName: string
}

export interface ContestViews {
  'preview': ContestPreView
}

export interface ContestModel<R extends ResultTypes, P extends ParticipantTypes> {
  id: string
  name: string
  adminId: string
  // contestType: ContestTypes // do i need this?
  scoringType: ScoringTypes
  status: ContestStatuses
  teeTime: string | null
  courseId: string
  scorecardIds: Array<string>
  results: Results[R]
  participants: Participants[P]
  parentContestId: string | null
  payoutId: string | null
}


export type ContestModelObject<R extends ResultTypes, P extends ParticipantTypes> = WithId<ContestModel<R, P>>

const getContestCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ContestModel<ResultTypes, ParticipantTypes>>('contests');
}


const createContest = async (contest: ContestModel<ResultTypes, ParticipantTypes>): Promise<string> => {
  const collection = await getContestCollection();
  const { acknowledged } = await collection.insertOne(contest);
  if (acknowledged) return contest.id;
  throw new Error ('There was an error creating the contest [model]');
}

const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
  const collection = await getContestCollection();
  const contest = await collection.findOne({ contestId });
  if (!contest) throw new Error ('There was an error getting the contest [model]')
  return contest;
}

// export interface ContestPreView {
//   id: string
//   name: string
//   status: ContestStatuses
//   teeTime: string | null
//   numParticipants: number
//   courseName: string
// }

const getUserContests = async <T extends ContestViewTypes>(userId: string, view: T): Promise<AggregationCursor<ContestViews[T]>> => {
  const collection = await getContestCollection();
  const pipeline: Array<Document> = [
    {
      $lookup: { from: 'teams', localField: 'participants.teamIds', foreignField: 'id', as: 'teams' }
    },
    {
      $lookup: { from: 'users', localField: 'participants.userIds', foreignField: 'id', as: 'users' }
    },
    {
      $match: { $or: [ { adminId: { $eq: userId } },  { $expr: { $in: [ userId, '$teams.userIds' ]  } }, { $expr: { $in: [ userId, '$users.userIds' ]  } } ] }
    },
    {
      $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'courses' }
    },
    {
      $project: { _id: 0, id: 1, name: 1, status: 1, teeTime: 1, courseName: { $first: '$courses.fullName' }, numParticipants: { $cond: { if: { $isArray: "$teams.userIds" }, then: { $size: "$teams.userIds" }, else: "$users.userIds" } } }
    }
  ]

  return await collection.aggregate<ContestViews[T]>(pipeline);
}


export default {
  createContest,
  getContest,
  getUserContests
}