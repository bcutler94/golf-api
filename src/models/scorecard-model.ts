import { IndexDescription, WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

interface HoleScore {
  grossStrokes: number
  netStrokes: number
  holeNumber: number
}

type ScorecardType = 'team' | 'player'

interface BaseScorecard {
  id: string
  type: ScorecardType
  contestId: string
  courseId: string
  scores: HoleScore[]
}

export interface PlayerScorecard extends BaseScorecard {
  type: 'player'
  playerId: string
  tees: string | null
  gender: string | null
  courseHandicap: number | null
}

export interface TeamScorecard extends BaseScorecard {
  type: 'team'
  teamId: string
}

export type ScorecardModel = PlayerScorecard | TeamScorecard


const getScorecardCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ScorecardModel>('scorecards');
}

const LEADERBOARD_INDEXES: IndexDescription[] = [
  {
    key: { playerId: 1, contestId: 1 },
    unique: true
  },
  {
    key: { teamId: 1, contestId: 1 },
    unique: true
  }
]

const addIndexes = async () => {
  try {
    const collection = await getScorecardCollection()
    const result = await collection.createIndexes(LEADERBOARD_INDEXES);
    logger.info('created scorecard indexes', result)
  } catch (e) {
    logger.error(`error adding index to scorecard`, e)
  }
}

addIndexes()

const createScorecard = async (model: ScorecardModel): Promise<ScorecardModel> => {
  const collection = await getScorecardCollection();
  const { acknowledged } = await collection.insertOne(model);
  if (!acknowledged) {
    logger.error('there was an error inserting scorecard');
    throw new Error()
  }
  return model;
}

const getContestScorecard = async (contestId: string, playerId: string): Promise<ScorecardModel | null> => {
  const collection = await getScorecardCollection();
  const scorecard = await collection.findOne({ contestId, playerId });
  return scorecard
}

// const getScorecard = async (contestId: string, userId: string): Promise<ScorecardModel | null> => {
//   const collection = await getScorecardCollection();
//   return await collection.findOne({ contestId, participantId: userId })
// }

// const createScorecard = async (scorecardInput: ScorecardModel): Promise<ScorecardModel> => {
//   const { participantId, contestId } = scorecardInput;
//   const collection = await getScorecardCollection();
//   const scorecard = await collection.findOne({ participantId, contestId });
//   if (scorecard) {
//     logger.error(`a scorecard already exists for contestId [${contestId}] participantId [${participantId}]`);
//     return scorecard;
//   }
//   const { acknowledged } = await collection.insertOne(scorecardInput)
//   if (!acknowledged) {
//     logger.error(`error creating scorecard for contestId [${contestId}] participantId [${participantId}]`)
//     throw new Error ('There was an error creating your scorecard for the contest. Please try again later')
//   }
//   return scorecardInput;
// }

// // do we care about people updating tees mid round? dont think so
// const setTees = async (scorecardId: string, tees: string, gender: string): Promise<ScorecardModel> => {
//   const collection = await getScorecardCollection();
//   const { value } = await collection.findOneAndUpdate({ id: scorecardId }, { $set: { tees, gender } }, { returnDocument: 'after' });
//   if (!value) {
//     logger.error('couldnt find and/or update scorecard tees')
//     throw new Error ('There was an error updating your scorecard. Please try again later.')
//   }
//   return value;
// }


export default {
  // getScorecardCollection,
  createScorecard,
  getContestScorecard
  // getScorecard,
  // createScorecard,
  // setTees
}