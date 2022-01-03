import { WithId, Document, AggregationCursor } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';
import { CourseModel } from './course-model';

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
  leaderboardId: string | null
}

interface Team {
  id: string
  name: string
  captainId: string
  userIds: string[]
}

export interface RyderCupContest extends BaseContest {
  type: 'ryder-cup'
  contestIds: string[]
  teams: Team[]
}

export interface IndividualStrokePlay extends BaseContest {
  type: 'individual-stroke-play'
  courseId: string
  scoringType: ScoringTypes
  userIds: string[]
  ryderCupContestId?: string
}

interface TeamMatchup {
  teams: Team[]
}

export interface BestBallMatchPlay extends BaseContest {
  type: 'best-ball-match-play'
  courseId: string
  scoringType: ScoringTypes
  teamMatchups: TeamMatchup[]
  ryderCupContestId?: string
}

interface TeamPlayer { 
  userId: string
  teamId: string
}
interface SingleMatchup {
  users: TeamPlayer[]
}

export interface SinglesMatchPlay extends BaseContest {
  type: 'singles-match-play'
  courseId: string
  scoringType: ScoringTypes
  singleMatchups: SingleMatchup[]
  ryderCupContestId?: string
}

export type ContestModel = SinglesMatchPlay | BestBallMatchPlay | IndividualStrokePlay | RyderCupContest

const getContestCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ContestModel>('contests');
}

const createContests = async (contests: ContestModel[]): Promise<ContestModel[]> => {
  const c = await getContestCollection();
  const { acknowledged } = await c.insertMany(contests);
  if (!acknowledged) {
    logger.error('error inserting contests', contests)
    throw new Error('Error saving contests')
  }
  return contests;
}

const getUserContests = async (userId: string): Promise<ContestModel[]> => {
  const collection = await getContestCollection();
  return await collection.find({ 
    $or: [
      { $expr: { $in: [ userId, { $ifNull: ['$adminIds', [] ] } ] } },
      { $expr: { $in: [ userId, { $ifNull: ['$userIds', [] ] } ] } },
      { $expr: { $in: [ userId, { $ifNull: ['$team.userIds', [] ] } ] } },
      { $expr: { $in: [ userId, { $ifNull: ['$teamMatchups.teams.userIds', [] ] } ] } },
      { $expr: { $eq: [ userId, { $ifNull: ['$singleMatchups.user.userId', [] ] } ] } },
    ]
  }).toArray()
}


const getRyderCupContests = async (ryderCupContestId: string): Promise<ContestModel[]> => {
  const collection = await getContestCollection();
  return await collection.find({ ryderCupContestId }).toArray()
}

const getContestCourse = async (contestId: string): Promise<CourseModel> => {
  const collection = await getContestCollection();
  const [ { course } = { course: null } ] = await collection.aggregate<{ course: CourseModel | undefined }>([
    {
      '$match': {
        'id': contestId,
      }
    }, {
      '$lookup': {
        'from': 'courses', 
        'localField': 'courseId', 
        'foreignField': 'id', 
        'as': 'course'
      }
    }, {
      '$project': {
        '_id': 0, 
        'course': {
          '$first': '$course'
        }
      }
    }
  ]).toArray();
  if (!course) {
    logger.error(`there was an error trying to find contest course for contestId [${contestId}]`)
    throw new Error ('There was an error retrieving course information. Please try again later.')
  }
  return course;
}

// const getCourseId = async (contestId: string): Promise<string> => {
//   const collection = await getContestCollection();
//   const contest = await collection.findOne({ id: contestId }, { projection: { courseId: 1 }});
//   if (!contest) {
//     logger.error(`1) couldnt find courseId for contestId [${contestId}]`);
//     throw new Error ('A course does not exist for this contest. Please try again later. (1)')
//   }
//   if (contest.courseId) {
//     return contest.courseId
//   } else {
//     logger.error(`2) couldnt find courseId for contestId [${contestId}]`);
//     throw new Error ('A course does not exist for this contest. Please try again later. (2)')
//   }
// }

const joinRyderContest = async (contestId: string, ) => {
  const collection = await getContestCollection();
  const { value } = await collection.findOneAndUpdate({ id: contestId }, { })
}

export default {
  getContestCollection,
  createContests,
  getUserContests,
  getContestCourse,
  // getCourseId,
  getRyderCupContests,
}