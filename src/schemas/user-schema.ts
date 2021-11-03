import { Static, Type } from '@sinclair/typebox'

const ErrorSchema =  Type.Object({
  code: Type.String(),
  statusCode: Type.Optional(Type.Number()),
  message: Type.String()
});

// user POST
const PostUserSchema = Type.Object({
  Body: Type.Object({
    firstName: Type.String(),
    lastName: Type.String(),
    ghin: Type.String()
  }),
  Reply: Type.Union([
    Type.Object({
      success: Type.Boolean(),
    }),
    ErrorSchema
  ]),
});

export type PostUserType = Static<typeof PostUserSchema>;

const userPost = {
  schema: {
    body: PostUserSchema,
    response: {
      200: PostUserSchema,
    },
  },
}

export default {
  userPost,
}