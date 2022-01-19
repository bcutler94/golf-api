import ghinApi from "../networking/ghin-api";
import userModel, { UserModel } from "../models/user-model";
import { v4 } from 'uuid';
import { POSTUserRoute } from "../routers/user-router";

const createUser = async (params: POSTUserRoute['Body']): Promise<UserModel> => {
  const { ghin, contestId, referrerUserId, pushToken, phoneNumber } = params;
  const { last_name: lastName, first_name: firstName, club_name: clubName, hi_value: currentHandicap } = await ghinApi.getUser(ghin);
  return await userModel.createUser({
    id: v4(), 
    ghin, 
    lastName, 
    clubName, 
    firstName, 
    currentHandicap,
    pushToken,
    phoneNumber,
    referralInfo: {
      contestId,
      referrerUserId
    }
  });
}

const getUser = async (userId: string): Promise<UserModel | undefined> => {
  return await userModel.getUser(userId)
}

export default {
  createUser,
  getUser
}