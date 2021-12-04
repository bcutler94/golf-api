import { Static, Type } from '@sinclair/typebox'

/**
 * General schemas and types
 */
const successSchema =  Type.Object({
  success: Type.Boolean({ value: true }),
});
type SuccessReply = Static<typeof successSchema>;

const errorSchema =  Type.Object({
  success: Type.Boolean({ value: false }),
  errorMessage: Type.String()
});
type ErrorReply = Static<typeof errorSchema>;

/**
 * User related schemas and types
 */

 const postUserBody = Type.Object({
  ghin: Type.String(),
  groupIds: Type.Array(Type.String())
});
type PostUserBody = Static<typeof postUserBody>;

const postUserReply = Type.Object({
  userId: Type.String(),
  ghin: Type.String(),
  groupIds: Type.Array(Type.String()),
  lastName: Type.String(),
  firstName: Type.String(),
  clubName: Type.String(),
  currentHandicap: Type.Number(),
  token: Type.String()
});
type PostUserReply = Static<typeof postUserReply>;

export interface PostUser {
  Body: PostUserBody,
  Reply: PostUserReply & SuccessReply | ErrorReply
}

const res = Type.Union([
  Type.Intersect([
    postUserReply,
    successSchema
  ]),
  errorSchema
])

const getUserReply = Type.Object({
  userId: Type.String(),
  ghin: Type.String(),
  groupIds: Type.Array(Type.String()),
  lastName: Type.String(),
  firstName: Type.String(),
  clubName: Type.String(),
  currentHandicap: Type.Number(),
});

type GetUserReply = Static<typeof getUserReply>;

const post = {
  body: postUserBody,
  response: {
    200: res,
  },
}

export interface GetUser {
  Reply: GetUserReply & SuccessReply | ErrorReply
}

const get = {
  response: {
    200: res,
  },
}

export default {
  post,
  get
}