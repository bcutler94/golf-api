import { Static, Type } from '@sinclair/typebox'

/**
 * General schemas and types
 */
const ErrorSchema =  Type.Object({
  code: Type.String(),
  statusCode: Type.Optional(Type.Number()),
  message: Type.String()
});

/**
 * User related schemas and types
 */

const PostUserSchema = Type.Object({
  Body: Type.Object({
    ghin: Type.String(),
    groupIds: Type.Array(Type.String())
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