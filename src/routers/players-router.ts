import { FastifyPluginCallback } from "fastify";
import middleware from "../util/middleware";
import { APIResponse } from "../server";
import logger from "../util/logger";
import playerSchema from "../schemas/player-schema";
import playerHandler, { Player } from "../route-handlers/player-handler";

/**
 * GET
 */


interface SearchPlayersResponse {
  players: Player[]
}

interface GETPlayerSearchRoute {
  Params: {
    searchTerm: string
  }
  Reply: APIResponse<SearchPlayersResponse>
}

const playerRouter: FastifyPluginCallback = async (server) => {

  server.route<GETPlayerSearchRoute>({
    method: 'GET',
    url: '/players/search/:searchTerm',
    preValidation: [ middleware.verifyUser ],
    schema: playerSchema.search.schema,
    handler: async (req, rep) => {
      try {
        const { params: { searchTerm } } = req;
        const players = await playerHandler.searchPlayers(searchTerm);
        logger.info('GET /players/search')
        return {
          success: true,
          data: {
            players
          }
        }
      } catch (e) {
        logger.error('error GET /courses', e)
        rep.send({ success: false, errorMessage: e instanceof Error ? e.message : 'An error occurred' })
      }
    }
  })

}

export default playerRouter;