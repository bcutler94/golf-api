import playerModel, { PlayerModel } from "../models/player-model";
import ghinApi from "../networking/ghin-api"

export interface Player {
  firstName: string
  lastName: string
  club: string
  ghin: string
}

const searchPlayers = async (searchTerm: string): Promise<PlayerModel[]> => {
  const players = await playerModel.searchPlayers(searchTerm);
  return players.toArray()
}

export default {
  searchPlayers
}