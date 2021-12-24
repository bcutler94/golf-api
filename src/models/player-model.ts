import { WithId } from 'mongodb';
import database from '../data-layer/database';

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

export default {
  getPlayerCollection
}