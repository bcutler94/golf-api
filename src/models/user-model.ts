import { WithId } from 'mongodb';
import db from '../data-layer/database';

export interface UserModel {
  id: string
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
  const { acknowledged } = await db.collection<UserModel>('users').insertOne(user);
  if (acknowledged) return user;
  throw new Error ('There was an error creating the user [model]')
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