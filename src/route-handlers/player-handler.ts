import ghinApi from "../networking/ghin-api"

export interface Player {
  firstName: string
  lastName: string
  club: string
  ghin: string
}

const searchPlayers = async (searchTerm: string): Promise<Player[]> => {
  const players = await ghinApi.searchPlayers(searchTerm);
  return players.map(({ first_name, last_name, club_name, ghin }) => {
    return {
      firstName: first_name,
      lastName: last_name,
      club: club_name,
      ghin
    }
  })
}

export default {
  searchPlayers
}