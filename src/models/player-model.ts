import { AggregationCursor, CreateIndexesOptions, IndexDescription, IndexSpecification, WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

export interface PlayerModel {
  id: string
  externalId: number | null
  firstName: string
  lastName: string
  clubName: string
  currentHandicap: number
}

export type TeamModelObject = WithId<PlayerModel>;

const getPlayerCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<PlayerModel>('players');
}

const PLAYER_INDEXES: IndexDescription[] = [
  {
    key: { fullName: 'text' },
  }
]

const addIndexes = async () => {
  try {
    const collection = await getPlayerCollection()
    const res = await collection.createIndexes(PLAYER_INDEXES)
    logger.info('created player indexes', res)
  } catch (e) {
    logger.error(`error adding index to course model`, e)
  }
}

addIndexes()

const searchPlayers = async (searchTerm: string): Promise<AggregationCursor<PlayerModel>> => {
  try {
    const collection = await getPlayerCollection()
    return await collection.aggregate([
      {
        $match: {
          $text: {
              $search: "\"" + searchTerm + "\"", 
              $caseSensitive: false
          }
        }
      },
      { 
        $limit: 10
      }
    ])
  } catch (e) {
    logger.error(`error searching for players with searchTerm [${searchTerm}]`, e)
    throw new Error ('There was an error searching for players, please try again later')
  }
}

export default {
  getPlayerCollection,
  searchPlayers
}