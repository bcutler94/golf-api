import { WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

export interface PlayerModel {
  id: string
  externalId: number | null
  firstName: string
  lastName: string
  clubName: string
  fullName: string
  currentHandicap: number
}

export type TeamModelObject = WithId<PlayerModel>;

const getPlayerCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<PlayerModel>('players');
}
// const addIndexes = async () => {
//   try {
//     const collection = await getPlayerCollection()
//     const result = await collection.createIndex({ lastName: 1, clubName: 1, externalId: 1 }, { unique: true });
//     logger.info('created index', result)
//   } catch (e) {
//     logger.error(`error adding index to course model`, e)
//   }
// }

// addIndexes()

export default {
  getPlayerCollection
}