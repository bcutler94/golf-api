import { FastifyReply, FastifyRequest } from "fastify"
import { PostUserType } from "../schemas/user-schema"


const createUser = async (params: PostUserType['Body']) => {
  const { firstName, lastName, ghin } = params;
}

export default {
  createUser
}