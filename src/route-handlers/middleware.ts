import { FastifyReply, FastifyRequest } from "fastify"

const verifyUser = async (req: FastifyRequest, rep: FastifyReply, done: any) => {
  try {
    await req.jwtVerify()
    return done()
  } catch (err) {
    return rep.send(err)
  }
}

export default {
  verifyUser
}