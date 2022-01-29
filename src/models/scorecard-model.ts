import { IndexDescription, WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

export interface HoleScore {
  grossStrokes: number
  netStrokes: number
  shotsGiven: number
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

// export interface TeamScorecard extends BaseScorecard {
//   type: 'team'
//   teamId: string
// }

export type ScorecardModel = PlayerScorecard 
// | TeamScorecard


const getScorecardCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ScorecardModel>('scorecards');
}

const LEADERBOARD_INDEXES: IndexDescription[] = [
  {
    key: { playerId: 1, contestId: 1 },
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

const scoreHole = async (scorecardId: string, score: number, holeIndex: number): Promise<ScorecardModel> => {
  const collection = await getScorecardCollection();

  const projection = await collection.findOne({ id: scorecardId }, { projection: { scores: 1 } });
  if (!projection) {
    logger.error('cant find score')
    throw new Error()
  }

  const { value } = await collection.findOneAndUpdate(
    { id: scorecardId },
    {
      $set: {
        [`scores.${holeIndex}.netStrokes`]: score - projection.scores[0].shotsGiven,
        [`scores.${holeIndex}.grossStrokes`]: score,
      }
    },
    { 
      returnDocument: 'after',
    }
  );
  if (!value) {
    logger.error('couldnt find scorecard to score', scorecardId, score, holeIndex)
    throw new Error()
  }
  return value;
}

// const getPlayersContestScorecards = async (contestId: string, playerIds: string[]): Promise<ScorecardModel[]> => {
//   const collection = await getScorecardCollection();
//   return collection.find({ contestId, playerId: { $in: playerIds }} );
// }


export default {
  createScorecard,
  getContestScorecard,
  scoreHole,
  getScorecardCollection
}