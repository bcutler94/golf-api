import { WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';
import { ContestModel, ParticipantTypes } from './contest-model';

interface HoleScore {
  grossStrokes: number
  netStrokes: number
  holeNumber: number
  scorerIds: string
}

export interface ScorecardModel {
  id: string
  type: ParticipantTypes
  participantId: string // teamId or playerId/userId
  contestId: string
  scores: HoleScore[]
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
  const client = await database.getClient();
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const collection = await getScorecardCollection();
      const scorecard = await collection.findOne({ participantId, contestId }, { session });
      if (scorecard) {
        logger.error(`a scorecard already exists for contestId [${contestId}] participantId [${participantId}]`);
        await session.abortTransaction()
        return scorecard;
      }
      const { acknowledged } = await collection.insertOne(scorecardInput, { session })
      if (!acknowledged) {
        logger.error(`error creating scorecard for contestId [${contestId}] participantId [${participantId}]`)
        await session.abortTransaction()
        throw new Error ('There was an error creating your scorecard for the contest. Please try again later')
      }
      return scorecardInput;
    });
  } catch (e) {
    logger.error('there was an error with scorecard creation transaction', e)
    throw e
  } finally {
    await session.endSession()
  }
}


export default {
  getScorecardCollection,
  getScorecard,
  createScorecard
}