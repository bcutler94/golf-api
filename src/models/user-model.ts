import { WithId } from 'mongodb';
import db from '../data-layer/database';

export interface UserModel {
  userId: string
  ghin: string
  groupIds: Array<string>
  lastName: string
  firstName: string
  clubName: string
  currentHandicap: number
  pushToken?: string
  phoneNumber: string
}

export type UserModelObject = WithId<UserModel>

const createUser = async (user: UserModel): Promise<UserModel> => {
  const checkIfUserExists = await db.collection<UserModel>('users').findOne({ ghin: user.ghin });
  if (checkIfUserExists) return user;
  await db.collection('users').insertOne(user);
  return user;
}

const getUser = async (userId: string): Promise<UserModel> => {
  const user = await db.collection<UserModel>('users').findOne({ userId });
  if (!user) throw new Error (`Cant find userId: [${userId}]`);
  return user;
}

export default {
  createUser,
  getUser
}