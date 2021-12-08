import { RouteShorthandOptions } from "fastify"

const headerAuth = {
  headers: {
    type: 'object',
    required: ['Authorization'],
    properties: {
      'Authorization': { 
        type: 'string' 
      }
    },
  }
}

export default {
  headerAuth
}