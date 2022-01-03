import { WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';
import { ContestModel, ParticipantTypes } from './contest-model';

interface HoleScore {
  grossStrokes: number
  netStrokes: number
  holeNumber: number
}

type ScorecardType = 'team' | 'player'
export interface ScorecardModel {
  id: string
  type: ScorecardType
  participantId: string // teamId or playerId/userId
  contestId: string
  scores: HoleScore[]
  courseId: string
  tees: string | null
  gender: string | null
  courseHandicap: number | null
}


export type UserModelObject = WithId<ScorecardModel>;

const getScorecardCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<ScorecardModel>('scorecards');
}

const getScorecard = async (contestId: string, userId: string): Promise<ScorecardModel | null> => {
  const collection = await getScorecardCollection();
  return await collection.findOne({ contestId, participantId: userId })
}

const createScorecard = async (scorecardInput: ScorecardModel): Promise<ScorecardModel> => {
  const { participantId, contestId } = scorecardInput;
  const collection = await getScorecardCollection();
  const scorecard = await collection.findOne({ participantId, contestId });
  if (scorecard) {
    logger.error(`a scorecard already exists for contestId [${contestId}] participantId [${participantId}]`);
    return scorecard;
  }
  const { acknowledged } = await collection.insertOne(scorecardInput)
  if (!acknowledged) {
    logger.error(`error creating scorecard for contestId [${contestId}] participantId [${participantId}]`)
    throw new Error ('There was an error creating your scorecard for the contest. Please try again later')
  }
  return scorecardInput;
}

// do we care about people updating tees mid round? dont think so
const setTees = async (scorecardId: string, tees: string, gender: string): Promise<ScorecardModel> => {
  const collection = await getScorecardCollection();
  const { value } = await collection.findOneAndUpdate({ id: scorecardId }, { $set: { tees, gender } }, { returnDocument: 'after' });
  if (!value) {
    logger.error('couldnt find and/or update scorecard tees')
    throw new Error ('There was an error updating your scorecard. Please try again later.')
  }
  return value;
}


export default {
  getScorecardCollection,
  getScorecard,
  createScorecard,
  setTees
}