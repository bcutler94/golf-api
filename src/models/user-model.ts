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

export type UserModelObject = WithId<UserModel>;

const getUserCollection = () => db.collection<UserModel>('users');

const createUser = async (user: UserModel): Promise<UserModel> => {
  const checkIfUserExists = await getUserCollection().findOne({ ghin: user.ghin });
  if (checkIfUserExists) return user;
  await db.collection<UserModel>('users').insertOne(user);
  return user;
}

const getUser = async (userId: string): Promise<UserModel> => {
  const user = await getUserCollection().findOne({ userId });
  if (!user) throw new Error (`Cant find userId: [${userId}]`);
  return user;
}

export default {
  createUser,
  getUser
}