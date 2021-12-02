import fastify, { FastifyError } from 'fastify';
import userHander from './route-handlers/user-hander';
import userSchema, { PostUserType } from './schemas/user-schema';
import './mongo/database';

const server = fastify({ logger: { prettyPrint: true } });
export const logger = server.log

// user routes
server.get('/test', async (req, rep) => {
  rep.send('yo ben')
})

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