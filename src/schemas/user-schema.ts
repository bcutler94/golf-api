import { RouteShorthandOptions } from "fastify"

const post: RouteShorthandOptions = {
  schema: {
    body: {
      ghin: { 
        type: 'string',
        maxLength: 7,
        minLength: 7
      },
      phoneNumber: {
        type: 'string',
        maxLength: 10,
        minLength: 10
      },
      pushToken: {
        type: 'string',
        maxLength: 50
      },
      groupIds: { 
        type: 'array',
        maxItems: 5,
        items: {
          type: 'string'
        }
      }
    },
  }
}

export default {
  post,
}