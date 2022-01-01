import { WithId, Document, AggregationCursor } from 'mongodb';
import database from '../data-layer/database';
import { ContestPlayer, ContestTeam } from '../routers/contest-router';
import logger from '../util/logger';
import { CourseModel } from './course-model';

export const CONTEST_TYPES = [
  'parent',
  'child',
  'single'
] as const;

export const CONTEST_VIEW_TYPES = [
  'preview',
  'withChildren'
] as const;

export const TEAM_RESULT_TYPES = [
  'best-ball-match-play',
  'singles-match-play'
] as const;

export const INDIVIDUAL_RESULT_TYPES = [
  'individual-stoke-play',
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

export type ContestTypes = typeof CONTEST_TYPES[number]

export type ParticipantTypes = typeof PARTICIPANTS_TYPE[number]

export type ScoringTypes = typeof SCORING_TYPE[number]

export type ContestStatuses = typeof CONTEST_STATUSES[number]

export type ContestViewTypes = typeof CONTEST_VIEW_TYPES[number]

export type IndvidualResultTypes = typeof INDIVIDUAL_RESULT_TYPES[number]

export type TeamResultTypes = typeof TEAM_RESULT_TYPES[number]

export type ResultTypes = IndvidualResultTypes | TeamResultTypes

export interface ContestPreview {
  id: string
  type: ContestTypes
  name: string
  status: ContestStatuses
  teams: ContestTeam[] | null
  players: ContestPlayer[] | null
  courseName: string | undefined
  city: string | null
  state: string | null
  childContestIds: string[] | null
  resultType: ResultTypes | null
  scoringType: ScoringTypes | null
}

export interface ContestViews {
  preview: ContestPreview
  withChildren: ContestWithChildren
}

export interface ParentContest {
  type: 'parent'
  id: string
  adminId: string
  name: string
  childContestIds: string[]
  status: ContestStatuses
  participantType: ParticipantTypes
  leaderboardId: null | string
  teams: ContestTeam[]
  players: ContestPlayer[]
}

export interface ChildContest {
  type: 'child'
  id: string
  adminId: string
  name: string
  parentContestId: string
  courseId: string
  status: ContestStatuses
  resultType: ResultTypes
  scoringType: ScoringTypes
  leaderboardId: null | string
}

export interface SingleContest {
  type: 'single'
  id: string
  adminId: string
  name: string
  courseId: string
  status: ContestStatuses
  participantType: ParticipantTypes
  resultType: ResultTypes
  scoringType: ScoringTypes
  leaderboardId: null | string
  teams: ContestTeam[]
  players: ContestPlayer[]
}

export type ContestModel = ParentContest | ChildContest | SingleContest


export type ContestModelObject<R extends ResultTypes, P extends ParticipantTypes> = WithId<ContestModel>


const getContestCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ContestModel>('contests');
}

const addViewToPipeline = (pipeline: Array<Document>, view: ContestViewTypes): Array<Document> => {
  switch (view) {
    case 'preview':
      return [ 
        ...pipeline, 
        {
          $project: { 
            _id: 0, 
            type: 1,
            id: 1, 
            name: 1, 
            status: 1, 
            players: 1,
            teams: 1,
            childContestIds: 1,
            resultType: 1,
            scoringType: 1,
            courseName: { $first: '$course.fullName' }, 
            city: { $first: '$course.location.city' },
            state: { $first: '$course.location.state' },

          }
        }
      ]
    case 'withChildren': 
    return [ 
      ...pipeline, 
      {
        $project: { 
          _id: 0, 
          type: 1,
          id: 1, 
          name: 1, 
          status: 1, 
          adminId: 1,
          childContests: 1,
          players: 1,
          teams: 1,
        }
      }
    ]
    default:
      throw new Error ('Something really odd happened looking up contests.')
  }
}

const createContests = async (contests: ContestModel[]): Promise<void> => {
  const collection = await getContestCollection();
  const { acknowledged } = await collection.insertMany(contests);
  if (acknowledged) return;
  throw new Error ('There was an error creating the contest [model]');
}

const getContest = async (contestId: string): Promise<ContestModelObject<ResultTypes, ParticipantTypes>> => {
  const collection = await getContestCollection();
  const contest = await collection.findOne({ contestId });
  if (!contest) throw new Error ('There was an error getting the contest [model]')
  return contest;
}

const getUserContests = async <T extends ContestViewTypes>(userId: string, contestTypes: ContestTypes[], view: T): Promise<AggregationCursor<ContestViews[T]>> => {
  const collection = await getContestCollection();
  const pipeline: Array<Document> = [
    {
      $match: { 
        type: { $in: contestTypes },
        $or: [ 
          { adminId: { $eq: userId } }, 
          { $expr: { $in: [ userId, { $ifNull: [ '$teams.playerId', [] ] } ] } },
          { 'players.playerId': { $eq: userId } },
          // { $in: [ userId, '$teams.playerIds' ] }, 
          // { $eq: [ userId, '$players.playerId' ] } 
        ] 
      }
    },
    {
      $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'courses' }
    }
  ];

  return await collection.aggregate<ContestViews[T]>(addViewToPipeline(pipeline, 'preview'));
}
export interface ContestWithChildren {
  type: 'parent'
  id: string
  adminId: string
  name: string
  status: ContestStatuses
  players: ContestPlayer[]
  teams: ContestTeam[]
  childContests: ContestPreview[]
}

const getChildContests = async (contestId: string): Promise<AggregationCursor<ContestViews['withChildren']>> => {
  const collection = await getContestCollection();

  const lookupPipeline: Array<Document> = [
    {
      '$match': {
        '$expr': {
          '$in': [
            '$id', '$$childContestIds'
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'courses', 
        'localField': 'courseId', 
        'foreignField': 'id', 
        'as': 'course'
      }
    }
  ];

  const pipeline: Array<Document> = [
    {
      '$match': {
        'id': contestId
      }
    }, {
      '$lookup': {
        'from': 'contests', 
        'let': {
          'childContestIds': '$childContestIds'
        }, 
        'pipeline': addViewToPipeline(lookupPipeline, 'preview'), 
        'as': 'childContests'
      }
    }
  ];

  return await collection.aggregate(addViewToPipeline(pipeline, 'withChildren'))
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

const getCourseId = async (contestId: string): Promise<string> => {
  const collection = await getContestCollection();
  const contest = await collection.findOne({ id: contestId }, { projection: { courseId: 1 }});
  if (!contest) {
    logger.error(`1) couldnt find courseId for contestId [${contestId}]`);
    throw new Error ('A course does not exist for this contest. Please try again later. (1)')
  }
  if ('courseId' in contest) {
    return contest.courseId
  } else {
    logger.error(`2) couldnt find courseId for contestId [${contestId}]`);
    throw new Error ('A course does not exist for this contest. Please try again later. (2)')
  }
}

export default {
  getContestCollection,
  createContests,
  getContest,
  getUserContests,
  getChildContests,
  getContestCourse,
  getCourseId
}