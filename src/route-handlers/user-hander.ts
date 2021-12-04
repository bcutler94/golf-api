import ghinApi from "../networking/ghin-api";
import { PostUser } from "../schemas/user-schema";
import userModel, { UserModel } from "../models/user";
import { v4 } from 'uuid';

const createUser = async (params: PostUser['Body']): Promise<UserModel> => {
  const { ghin, groupIds } = params;
  const { last_name: lastName, first_name: firstName, club_name: clubName, hi_value: currentHandicap } = await ghinApi.getUser(ghin);
  return await userModel.createUser({ userId: v4(), ghin, lastName, clubName, firstName, currentHandicap, groupIds });
}

const getUser = async (userId: string): Promise<UserModel> => {
  return await userModel.getUser(userId)
}

export default {
  createUser,
  getUser
}