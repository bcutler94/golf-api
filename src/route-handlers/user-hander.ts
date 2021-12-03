import { FastifyReply, FastifyRequest } from "fastify"
import ghinApi from "../networking/ghin-api";
import { PostUserType } from "../schemas/user-schema";
import userModel from "../models/user";

const createUser = async (params: PostUserType['Body']): Promise<void> => {
  const { ghin, groupIds } = params;
  const { last_name: lastName, first_name: firstName, club_name: clubName, hi_value: currentHandicap } = await ghinApi.getUser(ghin);
  await userModel.createUser({ ghin, lastName, clubName, firstName, currentHandicap, groupIds });
  return;
}

export default {
  createUser
}