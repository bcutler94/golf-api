import { RouteShorthandOptions } from "fastify"

const post: RouteShorthandOptions = {
  schema: {
    body: {
      ghin: { 
        type: 'string',
        length: 7
      },
      phoneNumber: {
        type: 'string',
        length: 10
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