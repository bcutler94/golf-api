import { RouteShorthandOptions } from "fastify"
import genericSchema from "./generic-schema"

const search: RouteShorthandOptions = {
  schema: {
    headers: genericSchema.headerAuth,
    params: {
      type: 'object',
      required: [ 'searchTerm' ],
      properties: {
        searchTerm: {
          type: 'string',
          maxLength: 50
        }
      }
    },
  }
}

export default {
  search,

}