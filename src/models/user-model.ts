import { WithId } from 'mongodb';
import database from '../data-layer/database';
import logger from '../util/logger';

export interface UserModel {
  id: string
  ghin: string
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
  pushToken?: string
  phoneNumber: string
  referralInfo: {
    contestId?: string
    referrerUserId?: string
  }
}

export type UserModelObject = WithId<UserModel>;

const getUserCollection = async () => {
  const db = await database.getGolfDB()
  return db.collection<UserModel>('users');
}

const createUser = async (user: UserModel): Promise<UserModel> => {
  const collection = await getUserCollection()

  const checkIfUserExists = await collection.findOne({ ghin: user.ghin });
  if (checkIfUserExists) return checkIfUserExists;
  const { acknowledged } = await collection.insertOne(user);
  if (acknowledged) return user;
  throw new Error ('There was an error creating the user [model]')
}

const getUser = async (userId: string): Promise<UserModel | undefined> => {
  const collection = await getUserCollection()
  const user = await collection.findOne({ id: userId  });
  if (!user) {
    logger.error('cant find user', userId);
    return;
  }
  return user;
}

export default {
  getUserCollection,
  createUser,
  getUser
}