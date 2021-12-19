import { FastifyReply, FastifyRequest } from "fastify"

const verifyUser = async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await req.jwtVerify()
  } catch (err) {
    return rep.send(err)
  }
}

export default {
  verifyUser
}