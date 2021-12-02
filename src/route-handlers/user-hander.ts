import { FastifyReply, FastifyRequest } from "fastify"
import { PostUserType } from "../schemas/user-schema"


const createUser = async (params: PostUserType['Body']) => {
  const { ghin, groupIds } = params;
}

export default {
  createUser
}