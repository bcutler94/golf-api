import { WithId } from 'mongodb';
import database from '../data-layer/database';

export interface TeamModel {
  id: string
  captainId: string
  name: string
  userIds: string[]
}

export type TeamModelObject = WithId<TeamModel>;

const getTeamCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<TeamModel>('team');
}

export default {
}