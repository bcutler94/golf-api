import { WithId } from 'mongodb';
import database from '../data-layer/database';

export interface PlayerModel {
  id: string
  captainId: string
  name: string
  userIds: string[]
}

export type TeamModelObject = WithId<PlayerModel>;

const getPlayerCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<PlayerModel>('players');
}

export default {
}