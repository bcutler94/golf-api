
import { AnyBulkWriteOperation, Document } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';


export const CONTEST_TYPES = [
  'ryder-cup',
  'individual-stroke-play',
  'best-ball-match-play',
  'singles-match-play'
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


export type ContestTypes = typeof CONTEST_TYPES[number]

export type ScoringTypes = typeof SCORING_TYPE[number]

export type ContestStatuses = typeof CONTEST_STATUSES[number]


interface BaseContest {
  type: ContestTypes
  id: string
  adminIds: string[]
  name: string
  status: ContestStatuses
  userIds: string[]
}

export interface MultiDayContestBase extends BaseContest {
  contestIds: string[]
}

export interface SingleDayContestBase extends BaseContest {
  courseId: string
  scoringType: ScoringTypes
  ryderCupContestId?: string
}

type Teams = [
  { id: string, name: string, captainId: string, userIds: string[] },
  { id: string, name: string, captainId: string, userIds: string[] }
]

export type RyderCupLeaderboard = { 
  [teamId: string]: number
}
export interface RyderCupContest extends MultiDayContestBase {
  type: 'ryder-cup'
  teams: Teams
  leaderboard: {
    [contestId: string]: RyderCupLeaderboard
  }
}

interface StrokePlayPlayer {
  playerId: string
  teamId?: string
}

export type IndividualStrokePlayLeaderboard = {
  playerId: string,
  teamId?: string
  score: number
}[]
export interface IndividualStrokePlay extends SingleDayContestBase {
  type: 'individual-stroke-play'
  players: StrokePlayPlayer[]
  leaderboard: IndividualStrokePlayLeaderboard
}

export type TeamMatchup = [
  { player1Id: string, player2Id: string, teamId: string },
  { player1Id: string, player2Id: string, teamId: string },
]


export type BestBallMatchPlayLeaderboard = {
  thru: number
  holesUp: number
  winningTeamId: string
  losingTeamId: string
  isFinal: boolean
  isDormi: boolean
}
export interface BestBallMatchPlay extends SingleDayContestBase {
  type: 'best-ball-match-play'
  leaderboard: {
    [matchupId: string]: BestBallMatchPlayLeaderboard
  }
  teamMatchups: {
    [matchupId: string]: TeamMatchup
  }
}

export type SingleMatchup = [
  { playerId: string, teamId: string },
  { playerId: string, teamId: string }
]

export type SinglesMatchPlayLeaderboard = {
  thru: number,
  holesUp: number,
  winningPlayerId: string
  losingPlayerId: string
  isFinal: boolean
  isDormi: boolean
}
export interface SinglesMatchPlay extends SingleDayContestBase {
  type: 'singles-match-play'
  singleMatchups: {
    [matchupId: string]: SingleMatchup
  }
  leaderboard: {
    [matchupId: string]: SinglesMatchPlayLeaderboard
  }
}

export type SingleDayContests = SinglesMatchPlay | BestBallMatchPlay | IndividualStrokePlay
type MultiDayContests = RyderCupContest

export type ContestModel = SingleDayContests | MultiDayContests

const getContestCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ContestModel>('contests');
}

const createContest = async (contest: ContestModel): Promise<ContestModel> => {
  const c = await getContestCollection();
  const { acknowledged } = await c.insertOne(contest);
  if (!acknowledged) {
    logger.error('error inserting contests', contest)
    throw new Error('Error saving contests')
  }
  return contest;
}

const getUserContests = async (userId: string): Promise<ContestModel[]> => {
  const collection = await getContestCollection();
  logger.info('userif', userId)
  return await collection.find({ 
    // $or: [
    //   { 'teams.userIds': userId },
    //   { 'adminIds': userId },
    //   { 'teamMatchups.team'}
    //   { $expr: { $in: [ userId, { $ifNull: ['$teamMatchups.teams.userIds', [] ] } ] } },
    //   { $expr: { $eq: [ userId, { $ifNull: ['$singleMatchups.user.userId', [] ] } ] } },
    // ],
    userIds: userId,
    ryderCupContestId: null
  }).toArray()
}


interface GetSingleDayContest {
  type: 'single-day'
  contest: SingleDayContests
}

interface GetMultiDayContest {
  type: 'multi-day'
  contest: MultiDayContests
  childContests: SingleDayContests[]
}


export type GetContest = GetSingleDayContest | GetMultiDayContest

const getContest = async (contestId: string): Promise<GetContest> => {
  const collection = await getContestCollection();
  const pipeline: Document[] = [
    {
      '$match': {
        'id': contestId
      }
    }, {
      '$project': {
        'contest': '$$ROOT'
      }
    }, {
      '$lookup': {
        'from': 'contests', 
        'localField': 'contest.id', 
        'foreignField': 'ryderCupContestId', 
        'as': 'childContests'
      }
    }, {
      '$addFields': {
        'type': {
          '$cond': {
            'if': {
              '$in': [
                '$contest.type', [
                  'ryder-cup'
                ]
              ]
            }, 
            'then': 'multi-day', 
            'else': 'single-day'
          }
        }
      }
    }
  ]
  const [ contest ] = await collection.aggregate<GetContest | null>(pipeline).toArray()
  if (!contest) {
    logger.error('couldnt find contest', contestId)
    throw new Error ('couldnt find contest')
  }
  return contest;
}

const replaceContests = async (newContests: ContestModel[]): Promise<void> => {
  const collection = await getContestCollection();

  const ops: AnyBulkWriteOperation<ContestModel>[] = newContests.map(newContest => {
    return {
      replaceOne: {
        filter: { id: newContest.id },
        replacement: newContest
      }
    }
  })

  const { ok } = await collection.bulkWrite(ops);
  if (!ok) {
    logger.error('there was an error replacing contests', newContests)
    throw new Error()
  }
}

const getContestById = async (contestId: string): Promise<ContestModel> => {
  const collection = await getContestCollection();
  const contest = await collection.findOne({ id: contestId });
  if (!contest) {
    logger.error('couldnt find contest by id ', contestId)
    throw new Error()
  }
  return contest;
}

export default {
  getContestCollection,
  createContest,
  getUserContests,
  getContest,
  replaceContests,
  getContestById,
  // joinTeam,
  // getContestCourse,
  // getCourseId,
  // getRyderCupContests,
}