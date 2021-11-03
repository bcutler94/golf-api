import fastify, { FastifyError } from 'fastify';
import userHander from './handlers/user-hander';
import userSchema, { PostUserType } from './schemas/user-schema';

const server = fastify();

// user routes
server.post<PostUserType>('/user', userSchema.userPost, async (req, rep) => {
  try {
    const { body } = req;
    await userHander.createUser(body);
    rep.send({ success: true });
  } catch (e) {
    rep.send(e as FastifyError)
  }
})


server.listen(8080, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})